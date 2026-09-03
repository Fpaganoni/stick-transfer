import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AdminTableColumn {
  label: string;
  className?: string;
}

interface AdminTableHeaderProps {
  columns: AdminTableColumn[];
}

export function AdminTableHeader({ columns }: AdminTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        {columns.map((column) => (
          <TableHead key={column.label} className={column.className}>
            {column.label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}
