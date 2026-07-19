import {
  LoaderCircle,
  Upload,
} from 'lucide-react'
import type {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
  RefObject,
} from 'react'

interface SpreadsheetUploadAreaProps {
  inputRef: RefObject<HTMLInputElement | null>
  acceptedFormats: string
  isLoading: boolean
  onFileSelected: (file: File) => void
}

export function SpreadsheetUploadArea({
  inputRef,
  acceptedFormats,
  isLoading,
  onFileSelected,
}: SpreadsheetUploadAreaProps) {
  function handleInputChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    if (file) {
      onFileSelected(file)
    }

    event.target.value = ''
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault()

    const file = event.dataTransfer.files?.[0]

    if (file) {
      onFileSelected(file)
    }
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
  ) {
    if (
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault()
      inputRef.current?.click()
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={acceptedFormats}
        className="hidden"
        onChange={handleInputChange}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDrop={handleDrop}
        onDragOver={(event) =>
          event.preventDefault()
        }
        className="mt-6 flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 text-center transition hover:border-blue-300 hover:bg-blue-50/40"
      >
        {isLoading ? (
          <>
            <LoaderCircle
              size={38}
              className="animate-spin text-blue-600"
            />

            <p className="mt-4 font-semibold text-slate-950">
              Leyendo archivo
            </p>

            <p className="mt-2 text-sm text-slate-500">
              El tiempo dependerá del tamaño del archivo.
            </p>
          </>
        ) : (
          <>
            <div className="flex size-16 items-center justify-center rounded-3xl bg-blue-100 text-blue-600">
              <Upload size={29} />
            </div>

            <p className="mt-5 text-lg font-semibold text-slate-950">
              Arrastra tu archivo aquí
            </p>

            <p className="mt-2 text-sm text-slate-500">
              O haz clic para seleccionar un archivo
            </p>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              XLSX · XLS · XLSM · XLSB · CSV · TSV · ODS
            </p>
          </>
        )}
      </div>
    </>
  )
}