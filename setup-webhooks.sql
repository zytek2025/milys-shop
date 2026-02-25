-- 1. Habilitar la extensión para peticiones HTTP (si no está activa)
create extension if not exists "http" with schema "extensions";
-- 2. Crear la función que dispara el Webhook a n8n
create or replace function public.fn_trigger_mily_assistant() returns trigger language plpgsql security definer as $$ begin perform extensions.http_post(
        'https://zytek.app.n8n.cloud/webhook/mily-assistant-trigger',
        json_build_object(
            'record',
            row_to_json(new),
            'old_record',
            row_to_json(old),
            'operation',
            TG_OP,
            'table_name',
            TG_TABLE_NAME
        )::text,
        'application/json'
    );
return new;
end;
$$;
-- 3. Crear el trigger en la tabla de PEDIDOS (Orders)
drop trigger if exists tr_mily_order_webhook on public.orders;
create trigger tr_mily_order_webhook
after
insert
    or
update on public.orders for each row execute function public.fn_trigger_mily_assistant();
-- 4. Crear el trigger en la tabla de PERFILES (Profiles)
drop trigger if exists tr_mily_profile_webhook on public.profiles;
create trigger tr_mily_profile_webhook
after
insert on public.profiles for each row execute function public.fn_trigger_mily_assistant();