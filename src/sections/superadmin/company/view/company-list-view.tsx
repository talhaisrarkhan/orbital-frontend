'use client';

import { useState, useCallback, useEffect } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  rowInPage,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import type { ICompanyItem, ICompanyTableFilters } from 'src/types/company';
import { getCompanies, deleteCompany } from 'src/api/company';

import { CompanyTableRow } from '../company-table-row';
import { CompanyTableToolbar } from '../company-table-toolbar';
import { CompanyUsersDialog } from '../company-users-dialog';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Company Name' },
  { id: 'ceoName', label: 'CEO', width: 180 },
  { id: 'website', label: 'Website', width: 220 },
  { id: 'address', label: 'Address', width: 220 },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function CompanyListView() {
  const table = useTable();

  const router = useRouter();

  const confirm = useBoolean();

  const [tableData, setTableData] = useState<ICompanyItem[]>([]);
  
  const [viewUsersDialog, setViewUsersDialog] = useState<{ open: boolean; company: ICompanyItem | null }>({
    open: false,
    company: null,
  });

  const filters = useSetState<ICompanyTableFilters>({ name: '' });

 const fetchCompanies = useCallback(async () => {
  try {
    const res = await getCompanies();
    const companies = Array.isArray(res) ? res : [];

    const enrichedCompanies = companies.map((company: any) => {
      const ceo = company.users?.find((u: any) => u.role === "admin");

      return {
        ...company,
        ceoName: ceo?.name || null,
        ceoEmail: ceo?.email || null
      };
    });

    setTableData(enrichedCompanies);
  } catch (error) {
    console.error("Failed to fetch companies:", error);
  }
}, []);


  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset = !!filters.state.name;

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await deleteCompany(id);
        const deleteRow = tableData.filter((row) => row.id !== id);
        setTableData(deleteRow);
        table.onUpdatePageDeleteRow(dataInPage.length);
        toast.success('Delete success!');
      } catch (error) {
        console.error('Failed to delete company:', error);
        toast.error('Failed to delete company');
      }
    },
    [dataInPage.length, table, tableData]
  );

  const handleDeleteRows = useCallback(async () => {
    // Implement bulk delete if API supports it, otherwise loop
    // For now, just UI simulation or loop
    const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));
    setTableData(deleteRows);

    table.onUpdatePageDeleteRows({
      totalRowsInPage: dataInPage.length,
      totalRowsFiltered: dataFiltered.length,
    });
    
    toast.success('Delete success!');
  }, [dataFiltered.length, dataInPage.length, table, tableData]);

  const handleEditRow = useCallback(
    (id: string) => {
      router.push(`/dashboard/superadmin/companies/${id}/edit`);
    },
    [router]
  );

  const handleViewUsers = useCallback((company: ICompanyItem) => {
    setViewUsersDialog({ open: true, company });
  }, []);

  const handleCloseViewUsers = useCallback(() => {
    setViewUsersDialog({ open: false, company: null });
  }, []);

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Manage Companies"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Companies', href: '/dashboard/superadmin/companies' },
            { name: 'List' },
          ]}
          action={
            <Button
              component={RouterLink}
              href="/dashboard/superadmin/companies/new"
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              New Company
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <CompanyTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
          />

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered.length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  dataFiltered.map((row) => row.id)
                )
              }
              action={
                <Tooltip title="Delete">
                  <IconButton color="primary" onClick={confirm.onTrue}>
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Tooltip>
              }
            />

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={dataFiltered.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      dataFiltered.map((row) => row.id)
                    )
                  }
                />

                <TableBody>
                  {dataFiltered
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((row) => (
                      <CompanyTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        onEditRow={() => handleEditRow(row.id)}
                        onViewUsers={() => handleViewUsers(row)}
                      />
                    ))}

                  <TableEmptyRows
                    height={table.dense ? 56 : 56 + 20}
                    emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                  />

                  <TableNoData notFound={notFound} />
                </TableBody>
              </Table>
            </Scrollbar>
          </Box>

          <TablePaginationCustom
            page={table.page}
            dense={table.dense}
            count={dataFiltered.length}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      {viewUsersDialog.company && (
        <CompanyUsersDialog
          open={viewUsersDialog.open}
          onClose={handleCloseViewUsers}
          users={viewUsersDialog.company.users || []}
          companyName={viewUsersDialog.company.name}
        />
      )}

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete <strong> {table.selected.length} </strong> items?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteRows();
              confirm.onFalse();
            }}
          >
            Delete
          </Button>
        }
      />
    </>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: ICompanyItem[];
  filters: ICompanyTableFilters;
  comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { name } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (company) => company.name.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  return inputData;
}
