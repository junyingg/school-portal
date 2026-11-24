import type { ReactNode } from "react"
import { EmptyState } from "./EmptyState.tsx"
import { LoadErrorState } from "./LoadErrorState.tsx"
import { PageHeader } from "./PageHeader.tsx"
import { AddIcon, Button, Card, LoadingState } from "./ui/index.ts"

export interface ListQuery<Item> {
  readonly isPending: boolean
  readonly isError: boolean
  readonly data: readonly Item[] | undefined
  readonly refetch: () => unknown
}

export interface ListPageCopy {
  readonly title: string
  readonly addLabel: string
  readonly loadingMessage: string
  readonly emptyMessage: string
  readonly loadErrorMessage: string
}

interface ListPageProps<Item> {
  readonly copy: ListPageCopy
  readonly query: ListQuery<Item>
  readonly onAdd: () => void
  readonly renderList: (items: readonly Item[]) => ReactNode
}

interface AddButtonProps {
  readonly label: string
  readonly onClick: () => void
}

function AddButton({ label, onClick }: AddButtonProps) {
  return (
    <Button icon={<AddIcon />} onClick={onClick}>
      {label}
    </Button>
  )
}

export function ListPage<Item>({ copy, query, onAdd, renderList }: ListPageProps<Item>) {
  const items = query.data ?? []
  const isEmpty = !query.isPending && !query.isError && items.length === 0
  const addButton = <AddButton label={copy.addLabel} onClick={onAdd} />

  function renderCardContent() {
    if (query.isPending) {
      return <LoadingState message={copy.loadingMessage} />
    }
    if (query.isError) {
      return (
        <LoadErrorState
          message={copy.loadErrorMessage}
          onRetry={() => {
            void query.refetch()
          }}
        />
      )
    }
    if (isEmpty) {
      return <EmptyState message={copy.emptyMessage} action={addButton} />
    }
    return renderList(items)
  }

  return (
    <>
      <PageHeader title={copy.title} action={isEmpty ? undefined : addButton} />
      <Card label={copy.title} isBusy={query.isPending}>
        {renderCardContent()}
      </Card>
    </>
  )
}
