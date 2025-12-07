import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';

import { useBoolean } from 'src/hooks/use-boolean';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover, usePopover } from 'src/components/custom-popover';

import type { ICompanyItem } from 'src/types/company';

// ----------------------------------------------------------------------

type Props = {
  row: ICompanyItem;
  selected: boolean;
  onSelectRow: VoidFunction;
  onDeleteRow: VoidFunction;
  onEditRow: VoidFunction;
  onViewUsers: VoidFunction;
};

export function CompanyTableRow({ row, selected, onSelectRow, onDeleteRow, onEditRow, onViewUsers }: Props) {
  const { name, logo, logoUrl, ceoName, ceoEmail, website, address } = row;

  const confirm = useBoolean();

  const popover = usePopover();

  // Use logo or logoUrl (fallback)
  const companyLogo = logo || logoUrl;

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar alt={name} src={companyLogo || ''} sx={{ mr: 2, cursor: 'pointer' }} variant="rounded" onClick={onViewUsers} />

          <ListItemText
            primary={name}
            secondary={ceoEmail}
            primaryTypographyProps={{ typography: 'body2', sx: { cursor: 'pointer', color: 'primary.main' }, onClick: onViewUsers }}
            secondaryTypographyProps={{
              component: 'span',
              color: 'text.disabled',
            }}
          />
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{ceoName || '-'}</TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{website || '-'}</TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{address || '-'}</TableCell>

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuItem
          onClick={() => {
            onViewUsers();
            popover.onClose();
          }}
        >
          <Iconify icon="solar:users-group-rounded-bold" />
          View Users
        </MenuItem>

        <MenuItem
          onClick={() => {
            onEditRow();
            popover.onClose();
          }}
        >
          <Iconify icon="solar:pen-bold" />
          Edit
        </MenuItem>

        <MenuItem
          onClick={() => {
            confirm.onTrue();
            popover.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          Delete
        </MenuItem>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content="Are you sure want to delete?"
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />
    </>
  );
}
