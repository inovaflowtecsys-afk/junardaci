import { supabase } from './supabaseClient';

const assertSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase não configurado no ambiente.');
  }
};

export const fetchRows = async (table, options = {}) => {
  assertSupabase();

  let query = supabase.from(table).select(options.select || '*', { count: options.count, head: options.head });

  if (options.eq) {
    query = query.eq(options.eq.column, options.eq.value);
  }

  if (options.ilike) {
    query = query.ilike(options.ilike.column, options.ilike.value);
  }

  if (options.or) {
    query = query.or(options.or);
  }

  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: options.ascending ?? true });
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  if (options.count && options.head) return count;
  if (options.count) return { data: data || [], count };

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
