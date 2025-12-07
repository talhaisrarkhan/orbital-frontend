import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';

import type { ICompanyUser } from 'src/types/company';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: VoidFunction;
  users: ICompanyUser[];
  companyName: string;
};

export function CompanyUsersDialog({ open, onClose, users, companyName }: Props) {
  // Filter out users with role 'admin' (CEO)
  const filteredUsers = users.filter((user) => user.role !== 'admin');

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pb: 2 }}>
        Users in {companyName}
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {filteredUsers.length} users found (excluding admins)
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Scrollbar sx={{ maxHeight: 60 * 8 }}>
          <TableContainer component={Paper} variant="outlined">
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          alt={user.name} 
                          src={user.profilePicture || ''} 
                          sx={{ mr: 2, width: 32, height: 32 }} 
                        />
                        {user.name}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Label
                          variant="soft"
                          color={
                            (user.role === 'departmentHead' && 'info') ||
                            (user.role === 'teamLead' && 'warning') ||
                            'default'
                          }
                        >
                          {user.role}
                        </Label>
                      </TableCell>
                      <TableCell>
                        <Label
                          variant="soft"
                          color={user.isActive ? 'success' : 'error'}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Label>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        No users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
