-- migrate:up
create type "job_status" as enum ('pending', 'processing', 'finished', 'failed');

create table "job" (
	id serial primary key,
	order_id uuid not null,
	api text not null,

	input text not null,
	output text,

	status "job_status" not null,
	error text,
	raw_request text not null,
	raw_response text,

	receive_at timestamptz not null,
	send_at timestamptz,
	finish_at timestamptz
);

-- migrate:down
-- drop table "job";
-- drop type "job_status";

