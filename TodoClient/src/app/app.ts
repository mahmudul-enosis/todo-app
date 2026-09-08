import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { form, FormField, pattern, required, submit } from '@angular/forms/signals';
import { Todo, TodoApi } from './todos/todo-api';

@Component({
  imports: [FormField],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly todoApi = inject(TodoApi);

  protected readonly todos = signal<Todo[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly busyId = signal<number | null>(null);
  protected readonly editingId = signal<number | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly completedCount = computed(
    () => this.todos().filter((todo) => todo.isComplete).length,
  );

  protected readonly taskModel = signal({ title: '' });
  protected readonly taskForm = form(this.taskModel, (path) => {
    required(path.title, { message: 'Enter a task title' });
    pattern(path.title, /\S/, { message: 'Enter a task title' });
  });

  constructor() {
    void this.loadTodos();
  }

  protected async save(): Promise<void> {
    await submit(this.taskForm, async () => {
      const title = this.taskModel().title.trim();
      if (!title) {
        return;
      }

      this.saving.set(true);
      this.errorMessage.set('');

      try {
        const editingId = this.editingId();

        if (editingId === null) {
          const created = await firstValueFrom(
            this.todoApi.create({ title, isComplete: false }),
          );
          this.todos.update((todos) => [...todos, created]);
        } else {
          const current = this.todos().find((todo) => todo.id === editingId);
          if (!current) {
            return;
          }

          await firstValueFrom(
            this.todoApi.update(editingId, {
              title,
              isComplete: current.isComplete,
            }),
          );
          this.todos.update((todos) =>
            todos.map((todo) =>
              todo.id === editingId ? { ...todo, title } : todo,
            ),
          );
        }

        this.finishEditing();
      } catch {
        this.errorMessage.set('The task could not be saved. Check that the API is running.');
      } finally {
        this.saving.set(false);
      }
    });
  }

  protected startEditing(todo: Todo): void {
    this.editingId.set(todo.id);
    this.taskForm().reset({ title: todo.title });
  }

  protected cancelEditing(): void {
    this.finishEditing();
  }

  protected async toggle(todo: Todo): Promise<void> {
    this.busyId.set(todo.id);
    this.errorMessage.set('');

    try {
      await firstValueFrom(
        this.todoApi.update(todo.id, {
          title: todo.title,
          isComplete: !todo.isComplete,
        }),
      );
      this.todos.update((todos) =>
        todos.map((item) =>
          item.id === todo.id ? { ...item, isComplete: !item.isComplete } : item,
        ),
      );
    } catch {
      this.errorMessage.set('The task status could not be updated.');
    } finally {
      this.busyId.set(null);
    }
  }

  protected async remove(todo: Todo): Promise<void> {
    this.busyId.set(todo.id);
    this.errorMessage.set('');

    try {
      await firstValueFrom(this.todoApi.delete(todo.id));
      this.todos.update((todos) => todos.filter((item) => item.id !== todo.id));
      if (this.editingId() === todo.id) {
        this.finishEditing();
      }
    } catch {
      this.errorMessage.set('The task could not be deleted.');
    } finally {
      this.busyId.set(null);
    }
  }

  protected async retry(): Promise<void> {
    await this.loadTodos();
  }

  private finishEditing(): void {
    this.editingId.set(null);
    this.taskForm().reset({ title: '' });
  }

  private async loadTodos(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      this.todos.set(await firstValueFrom(this.todoApi.getAll()));
    } catch {
      this.errorMessage.set('Tasks could not be loaded. Check that the API is running.');
    } finally {
      this.loading.set(false);
    }
  }
}
