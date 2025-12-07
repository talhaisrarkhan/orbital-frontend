'use client';

import type { ITeam } from 'src/types/team';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetTeams, deleteTeam } from 'src/api/team';
import { useGetDepartments } from 'src/api/department';

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

import { TeamTableRow } from '../team-table-row';
import { TeamTableToolbar } from '../team-table-toolbar';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Name' },
  { id: 'department', label: 'Department', width: 220 },
  { id: 'lead', label: 'Lead', width: 220 },
  { id: 'members', label: 'Members', width: 220 },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function TeamListView() {
  const table = useTable();

  const router = useRouter();

  const confirm = useBoolean();

  const { teams, teamsLoading } = useGetTeams();
  const { departments } = useGetDepartments();

  const filters = useSetState<{ name: string; department: string[] }>({ name: '', department: [] });

  const dataFiltered = applyFilter({
    inputData: teams,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset = !!filters.state.name || filters.state.department.length > 0;

  const notFound = (!dataFiltered.length && canReset) || (!dataFiltered.length && !teamsLoading);

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await deleteTeam(id);
        toast.success('Delete success!');
        window.location.reload();
      } catch (error) {
        console.error(error);
        toast.error('Delete failed!');
      }
    },
    []
  );

  const handleDeleteRows = useCallback(async () => {
    toast.info('Bulk delete not implemented yet');
  }, []);

  const handleEditRow = useCallback(
    (id: string) => {
   //   router.push(paths.dashboard.team.edit(id));
    },
    [router]
  );

  return (
    <>
      <DashboardContent>
        {/* <CustomBreadcrumbs
          heading="Teams"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Teams', href: paths.dashboard.team.root },
            { name: 'List' },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.team.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              New Team
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        /> */}

        <Card>
          <TeamTableToolbar
            filters={filters}
            departments={departments}
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
                      <TeamTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        onEditRow={() => handleEditRow(row.id)}
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

function applyFilter({
  inputData,
  comparator,
  filters,
}: {
  inputData: ITeam[];
  comparator: (a: any, b: any) => number;
  filters: { name: string; department: string[] };
}) {
  const { name, department } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (team) => team.name.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (department.length) {
    inputData = inputData.filter((team) => department.includes(team.departmentId));
  }

  return inputData;
}
