import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import type { ICompanyItem } from 'src/types/company';
import { createCompany, updateCompany } from 'src/api/company';

// ----------------------------------------------------------------------

export type NewCompanySchemaType = zod.infer<typeof NewCompanySchema>;

export const NewCompanySchema = zod.object({
  companyName: zod.string().min(1, { message: 'Company name is required!' }),
  companyDescription: zod.string().optional(),
  companyWebsite: zod.string().optional(),
  companyAddress: zod.string().optional(),
  companyLogo: schemaHelper.file({ message: { required_error: 'Logo is required!' } }).optional(),
  
  // CEO Details
  ceoName: zod.string().min(1, { message: 'CEO name is required!' }),
  ceoEmail: zod.string().min(1, { message: 'CEO email is required!' }).email(),
  ceoPassword: zod.string().min(6, { message: 'Password must be at least 6 characters!' }),
});

// ----------------------------------------------------------------------

type Props = {
  currentCompany?: ICompanyItem;
};

export function CompanyNewEditForm({ currentCompany }: Props) {
  const router = useRouter();

  const defaultValues = useMemo(
    () => ({
      companyName: currentCompany?.name || '',
      companyDescription: currentCompany?.description || '',
      companyWebsite: currentCompany?.website || '',
      companyAddress: currentCompany?.address || '',
      companyLogo: currentCompany?.logoUrl || null,
      ceoName: currentCompany?.ceoName || '',
      ceoEmail: currentCompany?.ceoEmail || '',
      ceoPassword: '', // Don't populate password on edit
    }),
    [currentCompany]
  );

  const methods = useForm<NewCompanySchemaType>({
    resolver: zodResolver(NewCompanySchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    control,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  useEffect(() => {
    if (currentCompany) {
      reset(defaultValues);
    }
  }, [currentCompany, defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (currentCompany) {
        await updateCompany(currentCompany.id, data);
        toast.success('Update success!');
      } else {
        await createCompany(data);
        toast.success('Create success!');
      }
      router.push('/dashboard/superadmin/companies');
    } catch (error) {
      console.error(error);
      toast.error(currentCompany ? 'Update failed!' : 'Create failed!');
    }
  });

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];

      const newFile = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });

      if (file) {
        setValue('companyLogo', newFile, { shouldValidate: true });
      }
    },
    [setValue]
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ pt: 10, pb: 5, px: 3 }}>
            <Box sx={{ mb: 5 }}>
              <Field.UploadAvatar
                name="companyLogo"
                maxSize={3145728}
                onDrop={handleDrop}
                helperText={
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 3,
                      mx: 'auto',
                      display: 'block',
                      textAlign: 'center',
                      color: 'text.disabled',
                    }}
                  >
                    Allowed *.jpeg, *.jpg, *.png, *.gif
                    <br /> max size of {3}MB
                  </Typography>
                }
              />
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <Field.Text name="companyName" label="Company Name" />
              <Field.Text name="companyWebsite" label="Website" />
              
              <Field.Text name="companyAddress" label="Address" />
              <Field.Text name="companyDescription" label="Description" multiline rows={4} sx={{ gridColumn: 'span 2' }} />

              <Box sx={{ gridColumn: 'span 2', mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  CEO Details
                </Typography>
              </Box>

              <Field.Text name="ceoName" label="CEO Name" />
              <Field.Text name="ceoEmail" label="CEO Email" />
              <Field.Text 
                name="ceoPassword" 
                label={currentCompany ? "New Password (Optional)" : "Password"} 
                type="password" 
              />
            </Box>

            <Stack alignItems="flex-end" sx={{ mt: 3 }}>
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                {!currentCompany ? 'Create Company' : 'Save Changes'}
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
