// MD-003: "5 acciones prioritarias" of the user's brands.

import {
  Link,
} from 'react-router-dom'

import {
  selectPriorityActions,
} from '../actions/selectPriorityActions'

import type {
  MyDayActionsResponse,
} from '../api/myDayTypes'

import {
  formatDate,
  formatInteger,
} from '../format/myDayFormat'

import {
  ACTION_PRIORITY_CLASSES,
  ACTION_PRIORITY_LABELS,
  ACTION_STATUS_LABELS,
} from '../format/myDayLabels'

import type {
  MyDayBlockState,
} from '../hooks/useMyDayBlock'

import {
  MyDayBlock,
} from './MyDayBlock'

import {
  blockErrorMessage,
  blockStatus,
} from './blockState'

interface MyDayPriorityActionsProps {
  state: MyDayBlockState<MyDayActionsResponse>
  brandKeys: readonly string[] | null
}

export function MyDayPriorityActions({
  state,
  brandKeys,
}: MyDayPriorityActionsProps) {
  const actions = state.data
    ? selectPriorityActions(state.data.rows ?? [], brandKeys)
    : []

  return (
    <MyDayBlock
      title="5 acciones prioritarias"
      note="Abiertas, en curso o bloqueadas · por prioridad y vencimiento"
      status={blockStatus(state, () => actions.length === 0)}
      errorMessage={blockErrorMessage(state.error)}
      emptyMessage="Sin acciones abiertas en tus marcas."
      onRetry={state.reload}
      footer={(
        <Link to="/actions" className="font-medium text-blue-700 hover:underline">
          Ver todas en Acciones
        </Link>
      )}
    >
      <ul className="flex flex-col divide-y divide-slate-100">
        {actions.map((action) => (
          <li key={action.id} data-my-day-action={action.id} className="flex flex-col gap-1 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-slate-900">
                {action.title}
              </p>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${ACTION_PRIORITY_CLASSES[action.priority]}`}>
                {ACTION_PRIORITY_LABELS[action.priority]}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              {action.brand_id} · {ACTION_STATUS_LABELS[action.status]} · vence {formatDate(action.due_date)}
              {action.days_overdue > 0 ? (
                <span className="font-medium text-rose-700">
                  {` · ${formatInteger(action.days_overdue)} ${action.days_overdue === 1 ? 'día' : 'días'} de atraso`}
                </span>
              ) : null}
            </p>
          </li>
        ))}
      </ul>
    </MyDayBlock>
  )
}
