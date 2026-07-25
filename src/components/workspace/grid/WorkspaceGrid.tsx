import type {
    PropsWithChildren,
} from 'react'

interface WorkspaceGridProps
    extends PropsWithChildren {

    columns?: 2 | 3 | 4

    gap?: 4 | 6

    className?: string

}

const columnStyles = {

    2: 'sm:grid-cols-2',

    3: 'xl:grid-cols-3',

    4: 'sm:grid-cols-2 xl:grid-cols-4',

}

const gapStyles = {

    4: 'gap-4',

    6: 'gap-6',

}

export function WorkspaceGrid({

    columns = 4,

    gap = 4,

    className = '',

    children,

}: WorkspaceGridProps){

    return(

        <section
            className={[
                'grid',
                columnStyles[columns],
                gapStyles[gap],
                className,
            ].join(' ')}
        >
            {children}
        </section>

    )

}