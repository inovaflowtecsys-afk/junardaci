import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useToast from './useToast';

export function useSaveConfirm(listPath) {
  const navigate = useNavigate();
  const { toasts, addToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSave = () => {
    addToast('Cadastro salvo com sucesso!', 'success');
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    navigate(listPath);
  };

  const handleStay = () => {
    setConfirmOpen(false);
  };

  return { handleSave, confirmOpen, handleConfirm, handleStay, toasts, addToast };
}
