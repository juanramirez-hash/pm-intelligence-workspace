// MD-003: block status and error text from a useMyDayBlock state.

import {
  MyDayApiError,
} from '../api/myDayApi'

import {
  NOT_AVAILABLE_FOR_ACCESS,
} from '../format/myDayLabels'

import type {
  MyDayBlockState,
} from '../hooks/useMyDayBlock'

import type {
  MyDayBlockStatus,
} from './MyDayBlock'

export function blockStatus<T>(
  state: Pick<MyDayBlockState<T>, 'status' | 'data'>,
  isEmpty: (data: T) => boolean,
): MyDayBlockStatus {
  if (state.status === 'loading' && state.data === null) {
    return 'loading'
  }

  if (state.status === 'error' || state.data === null) {
    return 'error'
  }

  return isEmpty(state.data) ? 'empty' : 'ready'
}

export function isAccessDenied(error: Error | null | undefined): boolean {
  return error instanceof MyDayApiError && error.status === 403
}

export function blockErrorMessage(error: Error | null | undefined): string {
  if (isAccessDenied(error)) {
    return NOT_AVAILABLE_FOR_ACCESS
  }

  return error?.message
    ? `No se pudo cargar esta sección: ${error.message}`
    : 'No se pudo cargar esta sección.'
}
