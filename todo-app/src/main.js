import './style.css'
import { supabase } from './supabase.js'

const app = document.querySelector('#app')
const isValidTodoRow = (value) =>
  typeof value === 'object' &&
  value !== null &&
  (typeof value.id === 'string' || typeof value.id === 'number') &&
  typeof value.text === 'string' &&
  typeof value.is_complete === 'boolean'

const normalizeTodoRows = (value) => {
  if (!Array.isArray(value)) return []

  return value
    .filter(isValidTodoRow)
    .map((todo) => ({
      id: String(todo.id),
      text: todo.text.trim(),
      completed: todo.is_complete,
      created_at: todo.created_at,
    }))
    .filter((todo) => todo.text.length > 0)
}

const escapeHtml = (text) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

let todos = []

const loadTodosFromSupabase = async () => {
  const { data, error } = await supabase
    .from('todos')
    .select('id, text, is_complete, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  todos = normalizeTodoRows(data)
}

const render = () => {
  const completedCount = todos.filter((todo) => todo.completed).length
  const remainingCount = todos.length - completedCount

  app.innerHTML = `
    <main class="todo-app">
      <header>
        <h1>Todo List</h1>
        <p>Keep track of what matters next.</p>
      </header>

      <form id="todo-form" class="todo-form">
        <input
          id="todo-input"
          name="todo"
          type="text"
          placeholder="Add a new task..."
          autocomplete="off"
          required
        />
        <button type="submit">Add</button>
      </form>

      <p class="todo-stats">
        ${remainingCount} remaining • ${completedCount} completed
      </p>

      <ul class="todo-list" id="todo-list">
        ${
          todos.length === 0
            ? '<li class="empty">No todos yet. Add your first one.</li>'
            : todos
                .map(
                  (todo) => `
            <li class="todo-item ${todo.completed ? 'done' : ''}" data-id="${todo.id}">
              <label>
                <input type="checkbox" ${todo.completed ? 'checked' : ''} />
                <span>${escapeHtml(todo.text)}</span>
              </label>
              <button type="button" class="delete-btn" aria-label="Delete ${escapeHtml(todo.text)}">Delete</button>
            </li>
          `
                )
                .join('')
        }
      </ul>
    </main>
  `

  const form = document.querySelector('#todo-form')
  const input = document.querySelector('#todo-input')
  const list = document.querySelector('#todo-list')

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const value = input.value.trim()
    if (!value) return

    const { error } = await supabase
      .from('todos')
      .insert({ text: value, is_complete: false })

    if (error) {
      console.error('Failed to insert todo:', error)
      return
    }

    input.value = ''

    try {
      await loadTodosFromSupabase()
    } catch (loadError) {
      console.error('Failed to refresh todos after insert:', loadError)
      todos = []
    }

    render()
  })

  list.addEventListener('click', async (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return

    const item = target.closest('.todo-item')
    if (!item) return

    const id = item.dataset.id
    if (!id) return

    if (target.matches('.delete-btn')) {
      const { error } = await supabase.from('todos').delete().eq('id', id)

      if (error) {
        console.error(`Failed to delete todo ${id}:`, error)
        return
      }

      try {
        await loadTodosFromSupabase()
      } catch (loadError) {
        console.error('Failed to refresh todos after delete:', loadError)
        todos = []
      }

      render()
      return
    }

    if (target.matches('input[type="checkbox"]')) {
      const todo = todos.find((entry) => entry.id === id)
      if (!todo) return

      const { error } = await supabase
        .from('todos')
        .update({ is_complete: !todo.completed })
        .eq('id', id)

      if (error) {
        console.error(`Failed to update todo ${id}:`, error)
        return
      }

      try {
        await loadTodosFromSupabase()
      } catch (loadError) {
        console.error('Failed to refresh todos after toggle:', loadError)
        todos = []
      }

      render()
    }
  })
}

const initializeApp = async () => {
  try {
    await loadTodosFromSupabase()
  } catch (error) {
    console.error('Failed to load todos from Supabase:', error)
    todos = []
  }

  render()
}

initializeApp()
