import { useState } from 'react';

export function useCep(onSuccess) {
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');

  const buscarCep = async (valor) => {
    const raw = valor.replace(/\D/g, '');
    if (raw.length !== 8) {
      setCepError('');
      return;
    }

    setCepLoading(true);
    setCepError('');

    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      if (!res.ok) throw new Error('Erro de rede');
      const data = await res.json();
      if (data.erro) {
        setCepError('CEP não encontrado');
      } else {
        onSuccess({
          logradouro: data.logradouro || '',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          uf: data.uf || '',
        });
      }
    } catch {
      setCepError('Não foi possível consultar o CEP');
    } finally {
      setCepLoading(false);
    }
  };

  return { buscarCep, cepLoading, cepError };
}
