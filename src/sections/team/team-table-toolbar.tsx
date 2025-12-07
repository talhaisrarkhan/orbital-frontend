import type { IDepartment } from 'src/types/department';
import type { UseSetStateReturn } from 'src/hooks/use-set-state';

import { useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  onResetPage: () => void;
  filters: UseSetStateReturn<{ name: string; department: string[] }>;
  departments: IDepartment[];
};

export function TeamTableToolbar({ filters, departments, onResetPage }: Props) {
  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onResetPage();
      filters.setState({ name: event.target.value });
    },
    [filters, onResetPage]
  );

  const handleFilterDepartment = useCallback(
    (event: any) => {
      const {
        target: { value },
      } = event;
      onResetPage();
      filters.setState({ department: typeof value === 'string' ? value.split(',') : value });
    },
    [filters, onResetPage]
  );

  return (
    <Stack
      spacing={2}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      direction={{ xs: 'column', md: 'row' }}
      sx={{ p: 2.5, pr: { xs: 2.5, md: 1 } }}
    >
      <FormControl sx={{ flexShrink: 0, width: { xs: 1, md: 200 } }}>
        <InputLabel>Department</InputLabel>
        <Select
          multiple
          value={filters.state.department}
          onChange={handleFilterDepartment}
          input={<OutlinedInput label="Department" />}
          renderValue={(selected) => selected.map((value) => departments.find(d => d.id === value)?.name).join(', ')}
          MenuProps={{ PaperProps: { sx: { maxHeight: 240 } } }}
        >
          {departments.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              <Checkbox disableRipple size="small" checked={filters.state.department.includes(option.id)} />
              {option.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Stack direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}>
        <TextField
          fullWidth
          value={filters.state.name}
          onChange={handleFilterName}
          placeholder="Search..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
      </Stack>
    </Stack>
  );
}
