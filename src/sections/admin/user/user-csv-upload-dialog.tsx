import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { Upload } from 'src/components/upload';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

import { uploadUserCsv } from 'src/api/user-management';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: VoidFunction;
  onSuccess: VoidFunction;
};

export function UserCsvUploadDialog({ open, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleDrop = useCallback((acceptedFiles: File[]) => {
    const newFile = acceptedFiles[0];
    if (newFile) {
      setFile(newFile);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      await uploadUserCsv(file);
      toast.success('CSV uploaded successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload CSV');
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Upload Users CSV</DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Upload a CSV file containing user details to bulk add users.
          The CSV should have headers: name, email, password, role.
        </Typography>

        <Upload
          value={file}
          onDrop={handleDrop}
          onDelete={handleRemoveFile}
          accept={{ 'text/csv': ['.csv'] }}
          maxSize={3145728} // 3MB
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Cancel
        </Button>
        <LoadingButton
          onClick={handleUpload}
          variant="contained"
          loading={uploading}
          disabled={!file}
          startIcon={<Iconify icon="eva:cloud-upload-fill" />}
        >
          Upload
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
