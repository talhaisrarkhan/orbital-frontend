import { toast } from 'sonner';

// ----------------------------------------------------------------------

type SnackbarVariant = 'success' | 'error' | 'info' | 'warning' | 'default';

interface SnackbarOptions {
    variant?: SnackbarVariant;
    duration?: number;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function useSnackbar() {
    const enqueueSnackbar = (message: string, options?: SnackbarOptions) => {
        const { variant = 'default', duration, description, action } = options || {};

        const toastOptions = {
            duration,
            description,
            action: action
                ? {
                    label: action.label,
                    onClick: action.onClick,
                }
                : undefined,
        };

        switch (variant) {
            case 'success':
                toast.success(message, toastOptions);
                break;
            case 'error':
                toast.error(message, toastOptions);
                break;
            case 'info':
                toast.info(message, toastOptions);
                break;
            case 'warning':
                toast.warning(message, toastOptions);
                break;
            default:
                toast(message, toastOptions);
        }
    };

    return {
        enqueueSnackbar,
        closeSnackbar: toast.dismiss,
    };
}
