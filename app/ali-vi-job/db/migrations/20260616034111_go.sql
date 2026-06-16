-- migrate:up
create type "job_status" as enum ('pending', 'processing', 'finished', 'failed');

create table "job" (
	id serial primary key,
	order_id uuid not null,

	status "job_status" not null,
	api text not null,
	input text not null,
	output text,

	receive_at timestamptz not null,
	send_at timestamptz,
	finish_at timestamptz
);

-- migrate:down

