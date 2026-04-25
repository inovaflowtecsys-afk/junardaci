import { supabase } from './supabaseClient';

const assertSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase não configurado no ambiente.');
  }
};

export const fetchRows = async (table, options = {}) => {
  assertSupabase();

  let query = supabase.from(table).select(options.select || '*');

  if (options.eq) {
    query = query.eq(options.eq.column, options.eq.value);
  }

  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: options.ascending ?? true });
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

export const insertRow = async (table, payload) => {
  assertSupabase();

  const { data, error } = await supabase
    .from(table)
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateRow = async (table, idField, id, payload) => {
  assertSupabase();

  const { data, error } = await supabase
    .from(table)
    .update(payload)
    .eq(idField, id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteRow = async (table, idField, id) => {
  assertSupabase();

  const { error } = await supabase
    .from(table)
    .delete()
    .eq(idField, id);

  if (error) throw error;
};
