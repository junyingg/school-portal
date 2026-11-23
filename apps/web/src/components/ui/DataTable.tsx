import { Table } from "antd"
import type { ReactNode } from "react"
import styles from "./DataTable.module.css"

export interface DataColumn<Row> {
  readonly key: string
  readonly title: string
  readonly width?: number | undefined
  readonly render: (row: Row, position: number) => ReactNode
}

interface DataTableProps<Row> {
  readonly label: string
  readonly columns: readonly DataColumn<Row>[]
  readonly rows: readonly Row[]
}

interface PositionedRow<Row> {
  readonly key: string
  readonly row: Row
  readonly position: number
}

function positionRows<Row>(rows: readonly Row[]): PositionedRow<Row>[] {
  return rows.map((row, index) => ({ key: String(index), row, position: index + 1 }))
}

export function DataTable<Row>({ label, columns, rows }: DataTableProps<Row>) {
  const tableColumns = columns.map((column) => ({
    key: column.key,
    title: column.title,
    ...(column.width === undefined ? {} : { width: column.width }),
    render: (_value: unknown, entry: PositionedRow<Row>) =>
      column.render(entry.row, entry.position),
  }))

  return (
    <div className={styles["scroll"]} role="region" aria-label={`${label} table`} tabIndex={0}>
      <Table<PositionedRow<Row>>
        aria-label={label}
        columns={tableColumns}
        dataSource={positionRows(rows)}
        pagination={false}
      />
    </div>
  )
}
