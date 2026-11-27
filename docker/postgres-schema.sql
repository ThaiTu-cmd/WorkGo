-- WorkGo PostgreSQL schema and additive migrations; no demo account/business seeds.
-- Exported by docker/export-schema.py from the canonical local schema.
-- Fresh empty DB: psql -v workgo_service=identity -v workgo_mode=fresh -f postgres-schema.sql
-- Existing DB: back up and review before using workgo_mode=upgrade.
\set ON_ERROR_STOP on
\if :{?workgo_service}
\else
  \echo 'Required: -v workgo_service=identity|catalog|job|order|payment|trust'
  \quit
\endif
\if :{?workgo_seed}
\else
  \set workgo_seed false
\endif
SELECT set_config('workgo.selected_service', :'workgo_service', false);
DO $workgo$
BEGIN
  IF current_setting('workgo.selected_service') NOT IN ('identity','catalog','job','order','payment','trust') THEN
    RAISE EXCEPTION 'Unknown workgo_service; choose identity, catalog, job, order, payment or trust';
  END IF;
END $workgo$;


-- DB-FINAL: explicit fresh mode is only for an EMPTY owner database.
\if :{?workgo_mode}
\else
  \set workgo_mode upgrade
\endif
SELECT set_config('workgo.mode', :'workgo_mode', false);
DO $mode$ BEGIN
 IF current_setting('workgo.mode') NOT IN ('fresh','upgrade') THEN RAISE EXCEPTION 'workgo_mode must be fresh or upgrade'; END IF;
 IF current_setting('workgo.mode')='fresh' AND EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','S')) THEN RAISE EXCEPTION 'fresh requires an empty public schema'; END IF;
END $mode$;
SELECT pg_advisory_lock(hashtext('workgo.schema:' || :'workgo_service'));
SELECT :'workgo_mode' = 'fresh' AS workgo_fresh \gset
\if :workgo_fresh
SELECT :'workgo_service' = 'identity' AS workgo_apply \gset
\if :workgo_apply
BEGIN;

    create table addresses (
        is_default boolean,
        is_deleted integer,
        created_at timestamp(6) with time zone,
        address_id uuid not null,
        user_id uuid,
        city varchar(255),
        contact_name varchar(255),
        contact_phone varchar(255),
        country_code varchar(255),
        district varchar(255),
        label varchar(255),
        latitude varchar(255),
        line1 varchar(255),
        longitude varchar(255),
        note varchar(255),
        ward varchar(255),
        primary key (address_id)
    );

    create table admin_action_logs (
        created_at timestamp(6) with time zone not null,
        actor_id uuid not null,
        admin_action_log_id uuid not null,
        action varchar(255) not null,
        actor_role varchar(255) not null,
        after_state TEXT,
        before_state TEXT,
        correlation_id varchar(255),
        reason TEXT,
        source varchar(255),
        target_id varchar(255) not null,
        target_type varchar(255) not null,
        primary key (admin_action_log_id)
    );

    create table invalid_tokens (
        expiry_time timestamp(6) with time zone,
        id varchar(255) not null,
        primary key (id)
    );

    create table provider_profiles (
        completed_order_count integer,
        is_accepting_orders boolean,
        is_deleted integer,
        is_financially_restricted boolean default false not null,
        rating_avg float(53),
        financial_restriction_version bigint default 0 not null,
        joined_at timestamp(6) with time zone,
        rating_aggregate_version bigint default 0 not null,
        rating_count bigint,
        updated_at timestamp(6) with time zone,
        provider_profile_id uuid not null,
        user_id uuid unique,
        bio varchar(255),
        business_name varchar(255),
        provider_type varchar(255) check (provider_type in ('INDIVIDUAL','COMPANY')),
        verification_status varchar(255) check (verification_status in ('PENDING','VERIFIED','REJECTED','SUSPENDED')),
        primary key (provider_profile_id)
    );

    create table provider_recovery_grants (
        approved_at timestamp(6) with time zone not null,
        expires_at timestamp(6) with time zone not null,
        reputation_version bigint not null,
        actor_id uuid not null,
        id uuid not null,
        provider_id uuid not null,
        reason varchar(1000) not null,
        primary key (id)
    );

    create table provider_reputation_snapshots (
        score integer not null,
        low_score_since timestamp(6) with time zone,
        source_version bigint not null,
        version bigint,
        provider_id uuid not null,
        policy_version varchar(255),
        primary key (provider_id)
    );

    create table provider_sanctions (
        effective_at timestamp(6) with time zone not null,
        expires_at timestamp(6) with time zone,
        revoked_at timestamp(6) with time zone,
        version bigint,
        actor_id uuid not null,
        id uuid not null,
        provider_id uuid not null,
        revoked_by uuid,
        user_id uuid not null,
        reference varchar(200) not null,
        reason varchar(1000) not null,
        revocation_reason varchar(1000),
        scope varchar(255) not null,
        primary key (id)
    );

    create table provider_score_reviews (
        score integer not null,
        reputation_version bigint not null,
        reviewed_at timestamp(6) with time zone not null,
        actor_id uuid not null,
        id uuid not null,
        provider_id uuid not null,
        sanction_id uuid,
        user_id uuid not null,
        outcome varchar(32) not null,
        reference varchar(200) not null,
        reason varchar(1000) not null,
        primary key (id),
        constraint uk_provider_score_review_version unique (provider_id, reputation_version)
    );



    create table provider_trust_events (
        approved_at timestamp(6) with time zone not null,
        delivered_at timestamp(6) with time zone,
        version bigint,
        provider_id uuid not null,
        user_id uuid not null,
        last_error varchar(255),
        primary key (provider_id)
    );

    create table provider_verification (
        is_deleted integer,
        created_at timestamp(6) with time zone,
        submitted_at timestamp(6) with time zone,
        updated_at timestamp(6) with time zone,
        verified_at timestamp(6) with time zone,
        provider_profile_id uuid,
        provider_verification_id uuid not null,
        verified_by uuid,
        document_type varchar(255),
        verification_status varchar(255) check (verification_status in ('PENDING','VERIFIED','REJECTED','SUSPENDED')),
        verification_type varchar(255) check (verification_type in ('IDENTITY_CARD','BUSINESS_LICENSE','TAX_CODE','PROFESSIONAL_CERT')),
        primary key (provider_verification_id)
    );

    create table refresh_sessions (
        revoked boolean not null,
        auth_time bigint not null,
        auth_version bigint not null,
        expires_at timestamp(6) with time zone not null,
        family_id uuid not null,
        user_id uuid not null,
        rotated_to varchar(64),
        token_hash varchar(64) not null,
        primary key (token_hash)
    );

    create table roles (
        role_name varchar(255) not null check (role_name in ('ADMIN','CLIENT','PROVIDER','SUPER_ADMIN')),
        primary key (role_name)
    );

    create table sanction_appeals (
        reviewed_at timestamp(6) with time zone,
        submitted_at timestamp(6) with time zone not null,
        version bigint,
        id uuid not null,
        reviewed_by uuid,
        sanction_id uuid not null,
        user_id uuid not null,
        decision_reason varchar(1000),
        explanation varchar(2000) not null,
        status varchar(255) not null,
        primary key (id),
        unique (sanction_id, user_id)
    );

    create table sanction_projections (
        blocked boolean not null,
        catalog_synced_version bigint not null,
        job_synced_version bigint not null,
        order_synced_version bigint not null,
        source_version bigint not null,
        version bigint,
        provider_id uuid not null,
        last_error varchar(255),
        primary key (provider_id)
    );

    create table security_support_requests (
        created_at timestamp(6) with time zone not null,
        version bigint,
        id uuid not null,
        contact varchar(254) not null,
        description varchar(2000) not null,
        status varchar(255) not null,
        primary key (id)
    );

    create table user_role (
        granted_at timestamp(6) with time zone,
        user_id uuid,
        user_role_id uuid not null,
        granted_by varchar(255),
        role_name varchar(255),
        primary key (user_role_id),
        unique (user_id, role_name)
    );

    create table users (
        authorization_version bigint not null,
        created_at timestamp(6) with time zone,
        version bigint,
        user_id uuid not null,
        avatar_url varchar(255),
        email varchar(255),
        first_name varchar(255),
        last_name varchar(255),
        password varchar(255),
        phone varchar(255),
        status varchar(255) check (status in ('ACTIVE','DISABLE')),
        user_name varchar(255),
        primary key (user_id),
        constraint uk_email_status unique (user_name, status),
        constraint uk_user_name_status unique (email, status),
        constraint uk_phone_status unique (phone, status)
    );

    create table verification_documents (
        created_at timestamp(6) with time zone not null,
        size_bytes bigint not null,
        provider_verification_id uuid not null,
        uploaded_by uuid not null,
        verification_document_id uuid not null,
        status varchar(32),
        mime_type varchar(255) not null,
        original_name varchar(255),
        sha256 varchar(255) not null,
        storage_key varchar(255) not null,
        primary key (verification_document_id)
    );

    create index idx_admin_action_logs_target 
       on admin_action_logs (target_type, target_id, created_at);

    create index idx_admin_action_logs_actor 
       on admin_action_logs (actor_id, created_at);

    create index ix_refresh_family 
       on refresh_sessions (family_id);

    create index ix_refresh_user 
       on refresh_sessions (user_id);

    alter table if exists addresses 
       add constraint FK1fa36y2oqhao3wgg2rw1pi459 
       foreign key (user_id) 
       references users;

    alter table if exists provider_profiles 
       add constraint FKsg72i9r07mvl4th8r2ihxuwg9 
       foreign key (user_id) 
       references users;

    alter table if exists provider_verification 
       add constraint FKqlayntiorv9i22j17ouskybdr 
       foreign key (provider_profile_id) 
       references provider_profiles;

    alter table if exists user_role 
       add constraint FKbg2a00xijeekgmp2gr3g55sid 
       foreign key (role_name) 
       references roles;

    alter table if exists user_role 
       add constraint FKj345gk1bovqvfame88rcx7yyx 
       foreign key (user_id) 
       references users;

    alter table if exists verification_documents 
       add constraint FKkbqfyh5jv76pw2038qo3gegnq 
       foreign key (provider_verification_id) 
       references provider_verification;

COMMIT;
\endif
SELECT :'workgo_service' = 'catalog' AS workgo_apply \gset
\if :workgo_apply
BEGIN;

    create table add_ons (
        is_deleted integer,
        price numeric(38,2),
        created_at timestamp(6) with time zone,
        updated_at timestamp(6) with time zone,
        add_on_id uuid not null,
        service_id uuid,
        currency varchar(255),
        description varchar(255),
        name varchar(255),
        status varchar(255) check (status in ('ACTIVE','INACTIVE')),
        primary key (add_on_id)
    );

    create table admin_action_logs (
        created_at timestamp(6) with time zone not null,
        actor_id uuid not null,
        admin_action_log_id uuid not null,
        action varchar(255) not null,
        actor_role varchar(255) not null,
        after_state TEXT,
        before_state TEXT,
        correlation_id varchar(255),
        reason TEXT,
        source varchar(255),
        target_id varchar(255) not null,
        target_type varchar(255) not null,
        primary key (admin_action_log_id)
    );

    create table available_rules (
        day_of_weeek integer,
        is_deleted integer,
        slot_duration_minute integer,
        created_at timestamp(6) with time zone,
        end_time timestamp(6) with time zone,
        start_time timestamp(6) with time zone,
        available_rule_id uuid not null,
        service_id uuid,
        status varchar(255) check (status in ('ACTIVE','INACTIVE')),
        primary key (available_rule_id)
    );

    create table booking_slots (
        created_at timestamp(6) with time zone,
        end_at timestamp(6) with time zone,
        hold_expires_at timestamp(6) with time zone,
        start_at timestamp(6) with time zone,
        updated_at timestamp(6) with time zone,
        available_rule_id uuid,
        booking_slot_id uuid not null,
        order_id uuid,
        service_id uuid,
        status varchar(255) check (status in ('AVAILABLE','HELD','BOOKED','BLOCKED')),
        version varchar(255),
        primary key (booking_slot_id)
    );

    create table categories (
        is_deleted integer,
        created_at timestamp(6) with time zone,
        updated_at timestamp(6) with time zone,
        category_id uuid not null,
        created_by uuid,
        parent_id uuid,
        updated_by uuid,
        description varchar(255),
        name varchar(255),
        slug varchar(255) unique,
        primary key (category_id),
        constraint "slug-isDeleted" unique (slug, is_deleted)
    );

    create table packages (
        delivery_days integer,
        duration_minute integer,
        is_deleted integer,
        price numeric(38,2),
        revision_limit integer,
        created_at timestamp(6) with time zone,
        updated_at timestamp(6) with time zone,
        package_id uuid not null,
        service_id uuid,
        currency varchar(255),
        description varchar(255),
        name varchar(255),
        package_status varchar(255) check (package_status in ('INACTIVE','ACTIVE')),
        primary key (package_id)
    );

    create table provider_financial_restrictions (
        is_restricted boolean not null,
        updated_at timestamp(6) with time zone,
        version bigint not null,
        provider_id uuid not null,
        primary key (provider_id)
    );

    create table provider_restriction_projections (
        blocked boolean not null,
        source_version bigint not null,
        version bigint,
        provider_id uuid,
        id varchar(255) not null,
        source varchar(255),
        primary key (id)
    );

    create table service_medias (
        is_cover boolean,
        is_deleted integer,
        created_at timestamp(6) with time zone,
        size_bytes bigint,
        service_id uuid,
        service_media_id uuid not null,
        status varchar(32),
        media_type varchar(255) check (media_type in ('IMAGE','VIDEO','FILE')),
        mime_type varchar(255),
        sha256 varchar(255),
        storage_key varchar(255),
        url varchar(255),
        primary key (service_media_id)
    );

    create table services (
        avg_rating float(53),
        base_price numeric(38,2) not null,
        is_deleted integer,
        created_at timestamp(6) with time zone,
        order_count bigint,
        published_at timestamp(6) with time zone,
        rating_aggregate_version bigint default 0 not null,
        review_count bigint,
        updated_at timestamp(6) with time zone,
        currency varchar(10) not null,
        category_id uuid,
        provider_id uuid not null,
        service_id uuid not null,
        description TEXT,
        execution_type varchar(255) not null check (execution_type in ('DIGITAL','ONSITE')),
        slug varchar(255) not null unique,
        status varchar(255) not null check (status in ('DRAFT','PUBLISHED','PAUSED','ARCHIVED')),
        title varchar(255) not null,
        primary key (service_id),
        constraint uk_service_slug_is_deleted unique (slug, is_deleted)
    );

    create index idx_admin_action_logs_target 
       on admin_action_logs (target_type, target_id, created_at);

    create index idx_admin_action_logs_actor 
       on admin_action_logs (actor_id, created_at);

    alter table if exists add_ons 
       add constraint FK5oy5bvs7ymy5tgedtipi8avhe 
       foreign key (service_id) 
       references services;

    alter table if exists available_rules 
       add constraint FKk5pt1ktdl9ku4gq3bvanyfbip 
       foreign key (service_id) 
       references services;

    alter table if exists booking_slots 
       add constraint FK1t99ysrj8x2f3y9kme7k6p2y5 
       foreign key (service_id) 
       references services;

    alter table if exists categories 
       add constraint FKsaok720gsu4u2wrgbk10b5n8d 
       foreign key (parent_id) 
       references categories;

    alter table if exists packages 
       add constraint FKryghicfhkpk9bm19bsa7f91i1 
       foreign key (service_id) 
       references services;

    alter table if exists service_medias 
       add constraint FKg47ljia4ropxpmedi3n44u82s 
       foreign key (service_id) 
       references services;

    alter table if exists services 
       add constraint FKhv7d5p40ipfq91065vlmqk8xv 
       foreign key (category_id) 
       references categories;

COMMIT;
\endif
SELECT :'workgo_service' = 'job' AS workgo_apply \gset
\if :workgo_apply
BEGIN;

    create table applications (
        is_deleted boolean not null,
        created_at timestamp(6) with time zone not null,
        updated_at timestamp(6) with time zone not null,
        application_id uuid not null,
        job_id uuid not null,
        provider_id uuid not null,
        message TEXT,
        status varchar(255) not null check (status in ('PENDING','ACCEPTED','REJECTED','WITHDRAWN')),
        primary key (application_id),
        constraint uq_app_job_provider unique (job_id, provider_id),
        constraint uq_app_id_job unique (application_id, job_id)
    );

    create table job_admin_audit (
        after_hidden boolean not null,
        before_hidden boolean not null,
        created_at timestamp(6) with time zone not null,
        actor_id uuid not null,
        id uuid not null,
        target_id uuid not null,
        reason varchar(1000) not null,
        action varchar(255),
        actor_role varchar(255),
        after_state TEXT,
        before_state TEXT,
        correlation_id varchar(255),
        source varchar(255),
        target_type varchar(255),
        primary key (id)
    );

    create table job_attachments (
        is_deleted boolean not null,
        created_at timestamp(6) with time zone not null,
        size_bytes bigint,
        attachment_id uuid not null,
        job_id uuid not null,
        uploaded_by uuid,
        status varchar(32),
        sha256 varchar(64),
        file_name varchar(255),
        file_url TEXT not null,
        mime_type varchar(255),
        storage_key varchar(255),
        primary key (attachment_id)
    );

    create table jobs (
        creation_key varchar(128),
        creation_hash varchar(64),
        budget_max numeric(19,2),
        budget_min numeric(19,2),
        is_deleted boolean not null,
        moderation_hidden boolean not null,
        created_at timestamp(6) with time zone not null,
        deadline_at timestamp(6) with time zone,
        updated_at timestamp(6) with time zone not null,
        version bigint not null,
        currency varchar(10) not null,
        category_id uuid not null,
        client_id uuid not null,
        job_id uuid not null,
        description TEXT,
        execution_type varchar(255) not null check (execution_type in ('DIGITAL','ONSITE','APPOINTMENT','HOURLY','PROJECT','DELIVERY')),
        location_snapshot TEXT,
        status varchar(255) not null check (status in ('OPEN','PAUSED','CLOSED','CANCELLED','EXPIRED')),
        title varchar(255) not null,
        primary key (job_id),
        constraint uk_job_creation_key unique (client_id, creation_key)
    );

    create table proposal_order_outbox (
        attempts integer not null,
        next_attempt_at timestamp(6) with time zone not null,
        updated_at timestamp(6) with time zone not null,
        version bigint,
        lease_token uuid,
        order_id uuid,
        proposal_id uuid not null,
        correlation_id varchar(64),
        last_error varchar(255),
        payload TEXT not null,
        status varchar(255) not null check (status in ('PENDING','PROCESSING','RETRY','SUCCEEDED','FAILED')),
        primary key (proposal_id)
    );

    create table proposals (
        estimated_days integer not null,
        is_deleted boolean not null,
        pending_slot integer,
        price numeric(19,2) not null,
        created_at timestamp(6) with time zone not null,
        expires_at timestamp(6) with time zone,
        updated_at timestamp(6) with time zone not null,
        version bigint not null,
        currency varchar(10) not null,
        application_id uuid not null,
        job_id uuid not null,
        proposal_id uuid not null,
        message TEXT,
        status varchar(255) not null check (status in ('PENDING','ACCEPTED','REJECTED','EXPIRED','WITHDRAWN')),
        terms TEXT,
        primary key (proposal_id),
        constraint uq_proposal_pending unique (application_id, pending_slot),
        constraint ck_proposal_pending_slot check ((status = 'PENDING' and pending_slot is not null and pending_slot = 1) or (status <> 'PENDING' and pending_slot is null))
    );

    create table provider_restrictions (
        blocked boolean not null,
        source_version bigint not null,
        version bigint,
        provider_id uuid not null,
        id varchar(255) not null,
        source varchar(255) not null,
        primary key (id)
    );

    create index idx_proposal_order_outbox_due 
       on proposal_order_outbox (status, next_attempt_at);

    alter table if exists applications 
       add constraint fk_application_job 
       foreign key (job_id) 
       references jobs;

    alter table if exists job_attachments 
       add constraint fk_attachment_job 
       foreign key (job_id) 
       references jobs;

    alter table if exists proposals 
       add constraint fk_proposal_application_job 
       foreign key (application_id, job_id) 
       references applications (application_id, job_id);

    alter table if exists proposals 
       add constraint fk_proposal_job 
       foreign key (job_id) 
       references jobs;

COMMIT;
\endif
SELECT :'workgo_service' = 'order' AS workgo_apply \gset
\if :workgo_apply
BEGIN;
create table cancellation_requests (counterpart_agreed boolean, fee_exempt_before_24h boolean, refund_percent integer, created_at timestamp(6) with time zone, projected_cancellation_fee bigint, responded_at timestamp(6) with time zone, cancellation_request_id uuid not null, case_id uuid, decision_id uuid, order_id uuid not null unique, requested_by uuid, responded_by uuid, execution_status varchar(255), note TEXT, reason_code varchar(255), requested_by_role varchar(255) check (requested_by_role in ('ADMIN','CLIENT','PROVIDER','SYSTEM')), status varchar(255) check (status in ('PENDING','ACCEPTED','REJECTED','AUTO_APPROVED','AWAITING_ADMIN_DECISION','DECISION_LINKED')), primary key (cancellation_request_id));
create table delivery_files (created_at timestamp(6) with time zone, size_bytes bigint, delivery_file_id uuid not null, delivery_package_id uuid, stored_file_id uuid, file_hash varchar(255), file_name varchar(255), file_url TEXT, mime_type varchar(255), primary key (delivery_file_id));
create table delivery_packages (version_no integer, created_at timestamp(6) with time zone, delivered_at timestamp(6) with time zone, delivery_package_id uuid not null, execution_id uuid, message TEXT, status varchar(255) check (status in ('SUBMITTED','ACCEPTED','REVISION_REQUESTED','REJECTED')), primary key (delivery_package_id), constraint uk_delivery_version unique (execution_id, version_no));
create table digital_executions (revision_limit integer, revisions_used integer, deadline_at timestamp(6) with time zone, requirement_submitted_at timestamp(6) with time zone, execution_id uuid not null, status varchar(255) check (status in ('AWAITING_REQUIREMENTS','WORKING','SUBMITTED','REVISING','ACCEPT','CANCELLED')), primary key (execution_id));
create table executions (completed_at timestamp(6) with time zone, created_at timestamp(6) with time zone, delivered_at timestamp(6) with time zone, started_at timestamp(6) with time zone, updated_at timestamp(6) with time zone, execution_id uuid not null, order_id uuid not null unique, execution_type varchar(255) check (execution_type in ('ONSITE','DIGITAL')), primary key (execution_id));
create table meet_authorizations (state_expires_at timestamp(6) with time zone, version bigint, user_id uuid not null, encrypted_refresh_token text, scope varchar(255), state varchar(255), primary key (user_id));
create table onsite_executions (actual_received_amount numeric(38,2), client_cash_paid_amount numeric(38,2), arrived_at timestamp(6) with time zone, cash_received_at timestamp(6) with time zone, client_accepted_at timestamp(6) with time zone, client_cash_paid_at timestamp(6) with time zone, scheduled_end timestamp(6) with time zone, scheduled_start timestamp(6) with time zone, service_completed_at timestamp(6) with time zone, slot_hold_expires_at timestamp(6) with time zone, booking_slot_id uuid, execution_id uuid not null, address_snapshot varchar(255), checkin_code_encrypted varchar(255), checkin_code_hash varchar(255), status varchar(255) check (status in ('SCHEDULED','IN_SERVICE','SERVICE_DONE','ACCEPT','CANCELLED')), primary key (execution_id));
create table order_agreement_versions (duration_days integer, price numeric(38,2) not null, version_no integer not null, client_confirmed_at timestamp(6) with time zone, created_at timestamp(6) with time zone not null, provider_confirmed_at timestamp(6) with time zone, schedule_end timestamp(6) with time zone, schedule_start timestamp(6) with time zone, agreement_version_id uuid not null, amendment_id uuid, fee_policy_version_id uuid, order_id uuid not null, acceptance_criteria TEXT, address TEXT, currency varchar(255), input_requirements TEXT, payment_method varchar(255) check (payment_method in ('WALLET','CASH')), policy_version varchar(255), reward_quote_ref varchar(255), scope TEXT, source varchar(255) not null, primary key (agreement_version_id), constraint uk_order_agreement_version unique (order_id, version_no));
create table order_amendments (base_version_no integer not null, new_duration_days integer, new_price numeric(38,2), old_duration_days integer, old_price numeric(38,2), created_at timestamp(6) with time zone not null, payment_adjusted_at timestamp(6) with time zone, responded_at timestamp(6) with time zone, version bigint, amendment_id uuid not null, order_id uuid not null, payment_receipt_id uuid, proposed_by uuid not null, responded_by uuid, new_scope TEXT, old_scope TEXT, proposed_by_role varchar(255) not null, reason TEXT not null, response_note TEXT, status varchar(255) not null, primary key (amendment_id));
create table order_completed_outbox (attempts integer not null, completed_at timestamp(6) with time zone not null, next_attempt_at timestamp(6) with time zone not null, claim_token uuid, client_id uuid not null, order_id uuid not null unique, provider_id uuid not null, service_id uuid, correlation_id varchar(64), event_id varchar(100) not null, last_error varchar(500), status varchar(255) not null, primary key (event_id));
create table order_dispute_decisions (actual_received_amount numeric(38,2), payment_received boolean, work_accepted boolean, applied_at timestamp(6) with time zone not null, effective_at timestamp(6) with time zone not null, cash_outcome_id uuid, decided_by uuid not null, decision_id uuid not null, dispute_id uuid not null, order_dispute_decision_id uuid not null, order_id uuid not null, settle_transaction_id uuid, settlement_receipt_id uuid, payload_hash varchar(64) not null, operation varchar(255) not null check (operation in ('RELEASE','REFUND')), order_status varchar(255) not null check (order_status in ('PENDING_PAYMENT','CONFIRMED','IN_PROGRESS','DELIVERED','COMPLETED','CANCELLED')), payment_status varchar(255) not null check (payment_status in ('PENDING','SUCCEEDED','RELEASED','REFUNDED','CASH_ON_SITE','CASH_SETTLED')), primary key (order_dispute_decision_id), constraint uk_order_dispute_decision unique (decision_id), constraint uk_order_dispute_decision_order unique (order_id));
create table order_input_checklists (agreement_version integer not null, checklist_version integer not null, accepted_at timestamp(6) with time zone, client_confirmed_at timestamp(6) with time zone, confirmation_base_version bigint, created_at timestamp(6) with time zone not null, escalated_at timestamp(6) with time zone, provider_confirmed_at timestamp(6) with time zone not null, reminder_24_at timestamp(6) with time zone, reminder_72_at timestamp(6) with time zone, response_due_at timestamp(6) with time zone, submitted_at timestamp(6) with time zone, version bigint, id uuid not null, order_id uuid not null, missing_reason text, requirements text not null, submitted_values text, primary key (id), unique (order_id, checklist_version));
create table order_input_notices (attempts integer not null, acknowledged_at timestamp(6) with time zone, next_attempt_at timestamp(6) with time zone not null, id uuid not null, order_id uuid not null, recipient_id uuid not null, type varchar(255) not null, primary key (id));
create table order_items (amount numeric(38,2), quantity integer, sort_order integer, unit_price numeric(38,2), created_at timestamp(6) with time zone, order_id uuid, order_item_id uuid not null, reference_id uuid, item_type varchar(255) check (item_type in ('PACKAGE','ADDON','PLATFORM_FEE','PROPOSAL')), name varchar(255), primary key (order_item_id));
create table order_lateness_states (escalated_7d boolean not null, verification_opened boolean not null, deadline_snapshot timestamp(6) with time zone, escalated_7d_at timestamp(6) with time zone, explanation_due_at timestamp(6) with time zone, explanation_submitted_at timestamp(6) with time zone, progress_responded_at timestamp(6) with time zone, proposed_remedy_at timestamp(6) with time zone, verification_ack_at timestamp(6) with time zone, verification_opened_at timestamp(6) with time zone, version bigint, order_id uuid not null, verification_notice_id uuid, explanation_evidence_ref varchar(500), progress_evidence_ref varchar(500), explanation_text TEXT, progress_summary TEXT, proposed_remedy TEXT, primary key (order_id));
create table order_snapshots (created_at timestamp(6) with time zone, order_id uuid not null, reward_quote_ref varchar(255), add_on_snapshot jsonb, execution_snapshot jsonb, package_snapshot jsonb, pricing_snapshot jsonb, proposal_snapshot jsonb, provider_snapshot jsonb, requirement_values jsonb, service_snapshot jsonb, primary key (order_id));
create table order_status_history (created_at timestamp(6) with time zone, actor_id uuid, order_id uuid, order_status_history_id uuid not null, from_status varchar(255) check (from_status in ('PENDING_PAYMENT','CONFIRMED','IN_PROGRESS','DELIVERED','COMPLETED','CANCELLED')), role_name varchar(255) check (role_name in ('ADMIN','CLIENT','PROVIDER','SYSTEM')), to_status varchar(255) check (to_status in ('PENDING_PAYMENT','CONFIRMED','IN_PROGRESS','DELIVERED','COMPLETED','CANCELLED')), primary key (order_status_history_id));
create table order_timer_notices (attempts integer not null, obsolete boolean not null, acknowledged_at timestamp(6) with time zone, deadline_at timestamp(6) with time zone, next_attempt_at timestamp(6) with time zone not null, id uuid not null, order_id uuid not null, recipient_id uuid not null, submission_id varchar(255) not null, type varchar(255) not null, primary key (id));
create table order_timer_pause_durations (elapsed_seconds bigint, order_id uuid not null, source_key varchar(255) not null, primary key (order_id, source_key));
create table order_timer_pauses (paused_at timestamp(6) with time zone, order_id uuid not null, source_key varchar(255) not null, primary key (order_id, source_key));
create table order_timer_receipts (paused boolean not null, require_new_delivery boolean not null, requires_new_delivery boolean not null, expected_version bigint, resume_at timestamp(6) with time zone, timer_version bigint not null, command_id uuid not null, order_id uuid not null, source_key varchar(255) not null, primary key (command_id));
create table order_timer_released (order_id uuid not null, source_key varchar(255));
create table order_timer_states (extension_used boolean not null, requires_new_delivery boolean not null, accepted_at timestamp(6) with time zone, due_at timestamp(6) with time zone, lock_version bigint, notification_ack_at timestamp(6) with time zone, paused_at timestamp(6) with time zone, remaining_seconds bigint not null, started_at timestamp(6) with time zone, timer_version bigint not null, total_paused_seconds bigint not null, order_id uuid not null, policy_version varchar(255) not null, submission_id varchar(255), primary key (order_id));
create table orders (is_deleted integer, platform_fee numeric(38,2), proposal_slot integer, provider_net_amount numeric(38,2), sub_total numeric(38,2), total_amount numeric(38,2), auto_completed_at timestamp(6) with time zone, cancelled_at timestamp(6) with time zone, completed_at timestamp(6) with time zone, confirmed_at timestamp(6) with time zone, created_at timestamp(6) with time zone, delivered_at timestamp(6) with time zone, placed_at timestamp(6) with time zone, start_at timestamp(6) with time zone, updated_at timestamp(6) with time zone, version bigint, client_id uuid, order_id uuid not null, package_id uuid, payment_id uuid, provider_id uuid, recovery_grant_id uuid unique, service_id uuid, source_id uuid, creation_request_hash varchar(64), idempotency_key varchar(128), currency varchar(255), execution_type varchar(255) check (execution_type in ('ONSITE','DIGITAL')), input_support_reason varchar(255), order_number varchar(255) unique, order_status varchar(255) check (order_status in ('PENDING_PAYMENT','CONFIRMED','IN_PROGRESS','DELIVERED','COMPLETED','CANCELLED')), payment_method varchar(255) check (payment_method in ('WALLET','CASH')), payment_status varchar(255) check (payment_status in ('PENDING','SUCCEEDED','RELEASED','REFUNDED','CASH_ON_SITE','CASH_SETTLED')), source_type varchar(255) check (source_type in ('SERVICE','PROPOSAL')), title varchar(255), primary key (order_id), constraint orderId_orderNumber unique (order_id, order_number), constraint uq_order_proposal_source unique (source_type, source_id, proposal_slot), constraint uq_order_client_creation_key unique (client_id, idempotency_key), constraint ck_order_proposal_slot check ((source_type = 'PROPOSAL' and source_id is not null and proposal_slot is not null and proposal_slot = 1) or ((source_type is null or source_type <> 'PROPOSAL') and proposal_slot is null)));
create table preview_events (occurred_at timestamp(6) with time zone, preview_version bigint not null, actor_id uuid, id uuid not null, preview_id uuid, note varchar(2000), type varchar(255), primary key (id));
create table preview_sessions (active_slot integer, pause_active boolean not null, closed_at timestamp(6) with time zone, created_at timestamp(6) with time zone, lock_version bigint, response_due_at timestamp(6) with time zone, schedule_due_at timestamp(6) with time zone, scheduled_at timestamp(6) with time zone, version bigint not null, attempt_id uuid, host_user_id uuid, id uuid not null, order_id uuid not null, request_key uuid not null, requester_id uuid, schedule_proposer_id uuid, last_error varchar(255), meeting_uri varchar(255), room_status varchar(255), space_name varchar(255) unique, status varchar(255), submission_id varchar(255), primary key (id), unique (order_id, active_slot), unique (order_id, request_key));
create table provider_admissions (last_consumed_recovery_grant_id uuid, provider_id uuid not null, reservation_grant_id uuid, primary key (provider_id));
create table provider_restriction_projections (blocked boolean not null, source_version bigint not null, version bigint, provider_id uuid, id varchar(255) not null, source varchar(255), primary key (id));
create table revision_criterion_refs (ref_index integer not null, revision_request_id uuid not null, criterion_ref varchar(255), primary key (ref_index, revision_request_id));
create table revision_requests (agreement_version integer, delivery_version integer, agreed_repair_deadline timestamp(6) with time zone, created_at timestamp(6) with time zone, deadline_agreed_at timestamp(6) with time zone, deadline_agreement_due_at timestamp(6) with time zone, proposed_repair_deadline timestamp(6) with time zone, resolved_at timestamp(6) with time zone, responded_at timestamp(6) with time zone, response_due_at timestamp(6) with time zone, delivery_package_id uuid, requested_by uuid, revision_request_id uuid not null, criteria_snapshot TEXT, provider_response TEXT, reason TEXT, scope_snapshot TEXT, status varchar(255) check (status in ('OPEN','RESPONDED','AGREED','RESOLVED','REJECTED')), primary key (revision_request_id));
create table reward_commit_outbox (acknowledged boolean not null, confirmed_at timestamp(6) with time zone not null, client_id uuid not null, order_id uuid not null, provider_id uuid not null, last_error varchar(255), quote_ref varchar(255) not null, primary key (order_id));
create table stored_files (evidence_hold boolean, created_at timestamp(6) with time zone not null, retention_until timestamp(6) with time zone, size_bytes bigint not null, order_id uuid not null, stored_file_id uuid not null, uploaded_by uuid not null, status varchar(32), context varchar(255) not null, mime_type varchar(255) not null, original_name varchar(255), sha256 varchar(255) not null, storage_key varchar(255) not null, primary key (stored_file_id));
create table work_evidences (latitude float(53), longitude float(53), captured_at timestamp(6) with time zone, created_at timestamp(6) with time zone, execution_id uuid, stored_file_id uuid, uploaded_by uuid, work_evidence_id uuid not null, file_url TEXT, phase varchar(255) check (phase in ('BEFORE','DURING','AFTER','ISSUE')), primary key (work_evidence_id));
create index idx_order_amendments_order on order_amendments (order_id, created_at);
create index ix_order_completed_outbox_due on order_completed_outbox (status, next_attempt_at);
create index idx_stored_files_order on stored_files (order_id, created_at);
alter table if exists cancellation_requests add constraint FK984ft31im9qiokn5h1wsmxk2u foreign key (order_id) references orders;
alter table if exists delivery_files add constraint FKneions16wpjof68b74so1p5yp foreign key (delivery_package_id) references delivery_packages;
alter table if exists delivery_packages add constraint FK4l2pytmck8nolvoo71s6djq2u foreign key (execution_id) references executions;
alter table if exists digital_executions add constraint FKlxdm2ag601klkt9v661y2c4sk foreign key (execution_id) references executions;
alter table if exists executions add constraint FKhfd9sai6sn6e62jlwtbhcdgx foreign key (order_id) references orders;
alter table if exists onsite_executions add constraint FKgomnfohnoo30mb0kw4hcqwerh foreign key (execution_id) references executions;
alter table if exists order_items add constraint FKbioxgbv59vetrxe0ejfubep1w foreign key (order_id) references orders;
alter table if exists order_snapshots add constraint FK3tmqvy0p5i8rnomhag689nt3h foreign key (order_id) references orders;
alter table if exists order_status_history add constraint FKnmcbg3mmbt8wfva97ra40nmp3 foreign key (order_id) references orders;
alter table if exists order_timer_pause_durations add constraint FKrb5r6v75g8b63wmiy4w1cenm0 foreign key (order_id) references order_timer_states;
alter table if exists order_timer_pauses add constraint FKhqul7pj1o3f3d6vnc0o5lja21 foreign key (order_id) references order_timer_states;
alter table if exists order_timer_released add constraint FKixy1180f0hgklpo0ghnx3dlv1 foreign key (order_id) references order_timer_states;
alter table if exists revision_criterion_refs add constraint FKo7ew3ifi9ax0c129jlvmxc7tf foreign key (revision_request_id) references revision_requests;
alter table if exists revision_requests add constraint FKl154usw3sah4ds9180yifqaa9 foreign key (delivery_package_id) references delivery_packages;
alter table if exists work_evidences add constraint FKoyyh21t1q0xulh3qedmuy744x foreign key (execution_id) references executions;

COMMIT;
\endif
SELECT :'workgo_service' = 'payment' AS workgo_apply \gset
\if :workgo_apply
BEGIN;
create table admin_action_logs (created_at timestamp(6) with time zone not null, actor_id uuid not null, admin_action_log_id uuid not null, action varchar(255) not null, actor_role varchar(255) not null, after_state TEXT, before_state TEXT, correlation_id varchar(255), reason TEXT, source varchar(255), target_id varchar(255) not null, target_type varchar(255) not null, primary key (admin_action_log_id));
create table cash_decision_receipts (cash_return_due bigint not null, created_at timestamp(6) with time zone not null, fee_amount bigint not null, order_amount bigint not null, return_confirmed_at timestamp(6) with time zone, version bigint, client_id uuid not null, decision_id uuid not null, dispute_id uuid not null, fee_assessment_id uuid not null, fee_policy_version_id uuid not null, order_id uuid not null, provider_id uuid not null, return_confirmed_by uuid, payload_hash varchar(64) not null, currency varchar(255) not null, status varchar(255) not null, primary key (decision_id), unique (order_id));
create table escrow_accounts (held_amount numeric(38,2) not null, order_sync_retry_count integer, platform_fee_amount numeric(38,2), provider_net_amount numeric(38,2), refunded_amount numeric(38,2), released_amount numeric(38,2), auto_release_at timestamp(6) with time zone, created_at timestamp(6) with time zone, held_at timestamp(6) with time zone, refunded_at timestamp(6) with time zone, released_at timestamp(6) with time zone, updated_at timestamp(6) with time zone, version bigint, active_dispute_id uuid, client_id uuid not null, escrow_account_id uuid not null, fee_policy_version_id uuid, hold_transaction_id uuid, order_id uuid not null unique, payment_id uuid unique, provider_id uuid not null, provider_user_id uuid, settle_transaction_id uuid, currency varchar(255), funding_source varchar(255) default 'GATEWAY' not null check (funding_source in ('GATEWAY','WALLET')), order_sync_status varchar(255) check (order_sync_status in ('NOT_REQUIRED','PENDING','SYNCED','FAILED')), status varchar(255) not null check (status in ('PENDING','HOLDING','RELEASED','REFUNDED','PARTIALLY_REFUNDED','FROZEN')), primary key (escrow_account_id));
create table escrow_command_receipts (processed_at timestamp(6) with time zone not null, dispute_id uuid not null, id uuid not null, operation varchar(16) not null check (operation in ('HOLD','FEE','RELEASE','REFUND','PARTIAL_REFUND','FREEZE','UNFREEZE','ADJUST')), order_id uuid not null, reason_code text not null, primary key (id), constraint uk_escrow_command unique (order_id, dispute_id, operation));
create table escrow_transactions (amount numeric(38,2) not null, balance_after numeric(38,2) not null, command_fee numeric(38,2), created_at timestamp(6) with time zone, actor_id uuid, escrow_account_id uuid not null, escrow_transaction_id uuid not null, saga_id uuid, reason_code varchar(255), triggered_by varchar(255) check (triggered_by in ('GATEWAY','ORDER','SYSTEM','ADMIN')), txn_type varchar(255) not null check (txn_type in ('HOLD','FEE','RELEASE','REFUND','PARTIAL_REFUND','FREEZE','UNFREEZE','ADJUST')), primary key (escrow_transaction_id));
create table fee_assessments (amount bigint not null, base_amount bigint not null, collected_amount bigint not null, created_at timestamp(6) with time zone not null, updated_at timestamp(6) with time zone, version bigint, charged_user_id uuid, collect_transaction_id uuid, decision_id uuid, fee_assessment_id uuid not null, fee_policy_version_id uuid not null, order_id uuid not null, charged_party varchar(255) not null check (charged_party in ('NONE','CLIENT','PROVIDER')), fee_type varchar(255) not null check (fee_type in ('SUCCESS','CANCELLATION')), status varchar(255) not null check (status in ('WAIVED','COLLECTED','OUTSTANDING')), primary key (fee_assessment_id), constraint uk_fee_assessment_order unique (order_id));
create table fee_policy_versions (cancellation_fee_rate numeric(5,4) not null, success_fee_rate numeric(5,4) not null, version_no integer not null, cancellation_fee_cap bigint not null, created_at timestamp(6) with time zone not null, effective_from timestamp(6) with time zone not null, created_by uuid, fee_policy_version_id uuid not null, reason TEXT not null, primary key (fee_policy_version_id), constraint uk_fee_policy_version_no unique (version_no));
create table fee_reminders (cancelled_at timestamp(6) with time zone, delivered_at timestamp(6) with time zone, due_at timestamp(6) with time zone not null, fee_assessment_id uuid not null, id uuid not null, milestone varchar(255) not null, primary key (id), constraint uk_fee_reminder_milestone unique (fee_assessment_id, milestone));
create table financial_restrictions (is_restricted boolean not null, catalog_synced_version bigint not null, identity_synced_version bigint not null, job_synced_version bigint not null, synced_at timestamp(6) with time zone, updated_at timestamp(6) with time zone, version bigint not null, provider_id uuid, user_id uuid not null, last_error varchar(200), primary key (user_id));
create table payments (amount numeric(38,2) not null, order_sync_retry_count integer, platform_fee_amount numeric(38,2), provider_net_amount numeric(38,2), created_at timestamp(6) with time zone, expires_at timestamp(6) with time zone, order_synced_at timestamp(6) with time zone, paid_at timestamp(6) with time zone, updated_at timestamp(6) with time zone, version bigint, order_id uuid not null, payer_id uuid not null, payment_id uuid not null, provider_id uuid, payment_code varchar(34) not null unique, currency varchar(255), deeplink TEXT, failure_code varchar(255), failure_message varchar(255), gateway varchar(255) not null check (gateway in ('MOCK','VNPAY','MOMO')), gateway_txn_id varchar(255), idempotency_key varchar(255) not null unique, order_sync_status varchar(255) check (order_sync_status in ('NOT_REQUIRED','PENDING','SYNCED','FAILED')), payment_method varchar(255) check (payment_method in ('QR','WALLET','ATM_CARD','INTL_CARD','CASH')), payment_url TEXT, purpose varchar(255) check (purpose in ('FULL','DEPOSIT','BALANCE','EXTRA')), qr_code_url TEXT, raw_response TEXT, status varchar(255) not null check (status in ('INITIATED','PENDING','SUCCEEDED','FAILED','EXPIRED','CANCELLED')), primary key (payment_id));
create table refunds (amount numeric(38,2) not null, created_at timestamp(6) with time zone, processed_at timestamp(6) with time zone, updated_at timestamp(6) with time zone, version bigint, escrow_account_id uuid, order_id uuid not null, payment_id uuid not null unique, refund_id uuid not null, failure_message varchar(255), gateway_ref varchar(255), initiated_by varchar(255) check (initiated_by in ('GATEWAY','ORDER','SYSTEM','ADMIN')), reason_code varchar(255) not null check (reason_code in ('ORDER_CANCELLED','SLOT_EXPIRED','ORDER_NOT_PAYABLE','DUPLICATE_PAYMENT')), status varchar(255) not null check (status in ('PENDING','PROCESSING','COMPLETED','FAILED')), primary key (refund_id));
create table settlement_receipts (amount bigint not null, destination_amount bigint not null, fee_amount bigint not null, settled_at timestamp(6) with time zone not null, decision_id uuid not null, destination_id uuid not null, dispute_id uuid, fee_assessment_id uuid, fee_policy_version_id uuid, order_id uuid not null, settle_transaction_id uuid not null, settlement_receipt_id uuid not null, payload_hash varchar(64) not null, branch varchar(255) not null check (branch in ('NONE','CLIENT','PROVIDER')), currency varchar(255) not null, destination varchar(255) not null check (destination in ('CLIENT','PROVIDER')), escrow_status varchar(255) not null check (escrow_status in ('PENDING','HOLDING','RELEASED','REFUNDED','PARTIALLY_REFUNDED','FROZEN')), funding_source varchar(255) check (funding_source in ('GATEWAY','WALLET')), operation varchar(255) not null check (operation in ('RELEASE','REFUND')), primary key (settlement_receipt_id), constraint uk_settlement_receipt_decision unique (decision_id), constraint uk_settlement_receipt_order unique (order_id));
create table verified_beneficiaries (expires_at timestamp(6) with time zone not null, verified_at timestamp(6) with time zone not null, id uuid not null, user_id uuid not null, account_name varchar(255) not null, account_number varchar(255) not null, bank_code varchar(255) not null, primary key (id));
create table wallet_accounts (balance bigint not null, created_at timestamp(6) with time zone not null, updated_at timestamp(6) with time zone, version bigint, wallet_account_id uuid not null, account_type varchar(255) not null, currency varchar(255) not null, owner_key varchar(255) not null, primary key (wallet_account_id), constraint uk_wallet_account_type_owner unique (account_type, owner_key));
create table wallet_ledger_entries (amount bigint not null, balance_after bigint not null, created_at timestamp(6) with time zone not null, wallet_account_id uuid not null, wallet_ledger_entry_id uuid not null, wallet_transaction_id uuid not null, primary key (wallet_ledger_entry_id));
create table wallet_payouts (amount bigint not null, created_at timestamp(6) with time zone not null, finished_at timestamp(6) with time zone, processing_at timestamp(6) with time zone, source_verified_at timestamp(6) with time zone, updated_at timestamp(6) with time zone, version bigint, hold_transaction_id uuid, payout_id uuid not null, settle_transaction_id uuid, user_id uuid not null, verified_beneficiary_id uuid, payout_code varchar(34) not null unique, payload_hash varchar(64), source_evidence_hash varchar(64), account_name varchar(255) not null, account_number varchar(255) not null, bank_code varchar(255) not null, currency varchar(255) not null, external_reference varchar(255) unique, failure_reason TEXT, idempotency_key varchar(255) not null unique, status varchar(255) not null check (status in ('REQUESTED','PROCESSING','UNKNOWN','PAID','FAILED','CANCELLED')), primary key (payout_id));
create table wallet_top_ups (amount bigint not null, confirmed_at timestamp(6) with time zone, created_at timestamp(6) with time zone not null, expires_at timestamp(6) with time zone not null, updated_at timestamp(6) with time zone, version bigint, top_up_id uuid not null, user_id uuid not null, wallet_transaction_id uuid, top_up_code varchar(34) not null unique, currency varchar(255) not null, deeplink TEXT, failure_code varchar(255), failure_message varchar(255), gateway varchar(255) not null check (gateway in ('MOCK','VNPAY','MOMO')), gateway_txn_id varchar(255), idempotency_key varchar(255) not null unique, payment_method varchar(255) check (payment_method in ('QR','WALLET','ATM_CARD','INTL_CARD','CASH')), payment_url TEXT, qr_code_url TEXT, raw_response TEXT, status varchar(255) not null check (status in ('INITIATED','PENDING','SUCCEEDED','FAILED','UNKNOWN')), primary key (top_up_id), constraint uk_wallet_top_up_gateway_txn unique (gateway, gateway_txn_id));
create table wallet_transactions (created_at timestamp(6) with time zone not null, obligation_id uuid not null, wallet_transaction_id uuid not null, description varchar(255), idempotency_key varchar(255) not null, payload_hash varchar(255) not null, posting_type varchar(255) not null, primary key (wallet_transaction_id), constraint uk_wallet_transaction_idempotency unique (idempotency_key));
create index idx_admin_action_logs_target on admin_action_logs (target_type, target_id, created_at);
create index idx_admin_action_logs_actor on admin_action_logs (actor_id, created_at);
create index idx_escrow_txn_account_created on escrow_transactions (escrow_account_id, created_at);
create index idx_fee_assessment_charged_user on fee_assessments (charged_user_id, status);
create index idx_fee_assessment_status on fee_assessments (status, created_at);
create index idx_fee_policy_effective on fee_policy_versions (effective_from, version_no);
create index idx_payment_order_status on payments (order_id, status);
create index idx_payment_status_expires on payments (status, expires_at);
create index idx_payment_status_sync on payments (status, order_sync_status);
create index idx_refund_order on refunds (order_id);
create index idx_refund_status on refunds (status);
create index idx_wallet_ledger_entries_account on wallet_ledger_entries (wallet_account_id, created_at);
create index idx_wallet_payout_user on wallet_payouts (user_id, created_at);
create index idx_wallet_payout_status on wallet_payouts (status, updated_at);
create index idx_wallet_top_up_user on wallet_top_ups (user_id, created_at);
create index idx_wallet_top_up_status_expires on wallet_top_ups (status, expires_at);
alter table if exists escrow_accounts add constraint FKrwvtsjdvc5hca0vmjsc1lt3t1 foreign key (payment_id) references payments;
alter table if exists escrow_transactions add constraint FKp9yfgn6i7vll449lsnq0aeewa foreign key (escrow_account_id) references escrow_accounts;
alter table if exists refunds add constraint FKfx8whr3jqix11kph0rdhpi3lq foreign key (escrow_account_id) references escrow_accounts;
alter table if exists refunds add constraint FKpt9ic0j1y6xwlej99wnynvnpy foreign key (payment_id) references payments;
alter table if exists wallet_ledger_entries add constraint FK76gxr7rfbgkbenakkvveq30ve foreign key (wallet_account_id) references wallet_accounts;
alter table if exists wallet_ledger_entries add constraint FK812p2bxrpcjwtguy6jp5ct3o7 foreign key (wallet_transaction_id) references wallet_transactions;

COMMIT;
\endif
SELECT :'workgo_service' = 'trust' AS workgo_apply \gset
\if :workgo_apply
BEGIN;

    create table dispute_decisions (
        attempts integer not null,
        late_cycles integer not null,
        terminal_conflict boolean not null,
        effective_at timestamp(6) with time zone not null,
        next_attempt_at timestamp(6) with time zone not null,
        version bigint,
        actor_id uuid not null,
        decision_id uuid not null,
        dispute_id uuid not null,
        lease_token uuid,
        order_id uuid not null,
        supersedes_decision_id uuid unique,
        correlation_id varchar(64),
        reason varchar(1000) not null,
        evidence_summary varchar(2000) not null,
        execution_status varchar(255) not null,
        fault_type varchar(255) not null,
        last_error varchar(255),
        operation varchar(255) not null,
        order_status varchar(255) not null,
        payment_result TEXT,
        payment_status varchar(255) not null,
        settlement_payload TEXT,
        timer_result TEXT,
        timer_status varchar(255) not null,
        primary key (decision_id),
        unique (dispute_id)
    );

    create table disputes (
        active_slot integer,
        client_extension_used boolean not null,
        is_deleted boolean not null,
        provider_extension_used boolean not null,
        claimed_at timestamp(6) with time zone,
        client_evidence_ack_at timestamp(6) with time zone,
        client_evidence_deadline timestamp(6) with time zone,
        client_evidence_extended_until timestamp(6) with time zone,
        client_extension_base_version bigint,
        created_at timestamp(6) with time zone not null,
        decision_escalated_at timestamp(6) with time zone,
        decision_sla_due_at timestamp(6) with time zone,
        evidence_deadline timestamp(6) with time zone,
        evidence_requested_at timestamp(6) with time zone,
        intake_escalated_at timestamp(6) with time zone,
        intake_sla_due_at timestamp(6) with time zone,
        provider_evidence_ack_at timestamp(6) with time zone,
        provider_evidence_deadline timestamp(6) with time zone,
        provider_evidence_extended_until timestamp(6) with time zone,
        provider_extension_base_version bigint,
        resolved_at timestamp(6) with time zone,
        updated_at timestamp(6) with time zone not null,
        version bigint not null,
        assigned_admin_id uuid,
        client_id uuid not null,
        decision_id uuid,
        dispute_id uuid not null,
        opened_by uuid not null,
        order_id uuid not null,
        provider_id uuid not null,
        opened_by_role varchar(30) not null,
        reason varchar(150) not null,
        client_extension_reason varchar(1000),
        evidence_request varchar(1000),
        provider_extension_reason varchar(1000),
        case_type varchar(255) not null,
        description TEXT,
        evidence_url TEXT,
        resolution TEXT,
        status varchar(255) not null check (status in ('OPEN','UNDER_REVIEW','RESOLVED_CLIENT','RESOLVED_PROVIDER','RESOLVED','REJECTED','CANCELLED','CLOSED')),
        primary key (dispute_id),
        constraint uq_dispute_order_active_slot unique (order_id, active_slot),
        constraint ck_dispute_active_slot check ((status IN ('OPEN', 'UNDER_REVIEW') AND active_slot IS NOT NULL AND active_slot = 1) OR (status NOT IN ('OPEN', 'UNDER_REVIEW') AND active_slot IS NULL))
    );

    create table inbox_events (
        processed_at timestamp(6) with time zone,
        received_at timestamp(6) with time zone not null,
        id uuid not null,
        payload_hash varchar(64) not null,
        event_type varchar(100) not null,
        event_id varchar(255) not null,
        payload TEXT not null,
        primary key (id),
        constraint uq_trust_inbox_event_id unique (event_id)
    );

    create table onsite_incidents (
        client_confirmed_reschedule boolean not null,
        client_contact_attempts integer not null,
        contact_attempts integer not null,
        contact_required boolean not null,
        force_majeure boolean not null,
        provider_confirmed_reschedule boolean not null,
        provider_contact_attempts integer not null,
        applicable_cancellation_fee bigint not null,
        arrival_fee bigint not null,
        effective_scheduled_end timestamp(6) with time zone,
        effective_scheduled_start timestamp(6) with time zone,
        first_contact_at timestamp(6) with time zone,
        incident_reported_at timestamp(6) with time zone,
        last_contact_at timestamp(6) with time zone,
        original_scheduled_end timestamp(6) with time zone,
        original_scheduled_start timestamp(6) with time zone,
        proposed_scheduled_end timestamp(6) with time zone,
        proposed_scheduled_start timestamp(6) with time zone,
        version bigint not null,
        client_id uuid not null,
        decision_id uuid,
        dispute_id uuid,
        incident_id uuid not null,
        order_id uuid not null unique,
        provider_id uuid not null,
        reschedule_proposed_by_role varchar(30),
        alleged_fault_party varchar(50),
        concluded_fault_party varchar(50),
        concluded_fault_type varchar(50),
        conclusion_status varchar(60) not null,
        financial_status varchar(60) not null,
        reschedule_status varchar(60),
        status varchar(60) not null,
        incident_type varchar(100),
        location_signal varchar(500),
        allegation_summary TEXT,
        evidence_url TEXT,
        primary key (incident_id)
    );

    create table onsite_progress_notices (
        contact_attempt_no integer not null,
        occurred_at timestamp(6) with time zone not null,
        actor_id uuid not null,
        notice_id uuid not null,
        order_id uuid not null,
        actor_role varchar(30) not null,
        notice_type varchar(60) not null,
        evidence_url TEXT,
        summary TEXT not null,
        primary key (notice_id)
    );

    create table outbox_events (
        attempts integer not null,
        created_at timestamp(6) with time zone not null,
        next_attempt_at timestamp(6) with time zone not null,
        processed_at timestamp(6) with time zone,
        version bigint not null,
        aggregate_id uuid not null,
        claim_token uuid,
        id uuid not null,
        correlation_id varchar(64),
        aggregate_type varchar(100) not null,
        event_type varchar(100) not null,
        delivery_result TEXT,
        last_error TEXT,
        payload TEXT not null,
        status varchar(255) not null check (status in ('PENDING','PROCESSING','COMPLETED','FAILED')),
        primary key (id)
    );

    create table private_evidence (
        evidence_hold boolean,
        created_at timestamp(6) with time zone not null,
        retention_until timestamp(6) with time zone,
        size_bytes bigint not null,
        dispute_id uuid not null,
        id uuid not null,
        uploader_id uuid not null,
        status varchar(32),
        checksum varchar(64) not null,
        mime_type varchar(255) not null,
        original_name varchar(255),
        storage_key varchar(255),
        primary key (id)
    );

    create table reports (
        is_deleted boolean not null,
        created_at timestamp(6) with time zone not null,
        resolved_at timestamp(6) with time zone,
        updated_at timestamp(6) with time zone not null,
        version bigint not null,
        handled_by uuid,
        report_id uuid not null,
        reporter_id uuid not null,
        resolved_by uuid,
        target_id uuid not null,
        reason varchar(150) not null,
        resolution_note varchar(1000),
        description TEXT,
        evidence_url TEXT,
        status varchar(255) not null check (status in ('PENDING','REVIEWING','RESOLVED','REJECTED')),
        target_type varchar(255) not null check (target_type in ('USER','POST','JOB','SERVICE','MESSAGE','ORDER','REVIEW')),
        primary key (report_id)
    );

    create table reputation_accounts (
        score integer not null,
        version bigint,
        provider_id uuid not null,
        primary key (provider_id)
    );

    create table reputation_ledger (
        after_score integer not null,
        applied_delta integer not null,
        before_score integer not null,
        requested_delta integer not null,
        created_at timestamp(6) with time zone not null,
        client_id uuid,
        decision_id uuid,
        id uuid not null,
        order_id uuid,
        provider_id uuid not null,
        reference_entry_id uuid,
        payload_hash varchar(64) not null,
        reason varchar(1000) not null,
        kind varchar(255) not null,
        policy_version varchar(255) not null,
        source_key varchar(255) not null,
        primary key (id),
        unique (provider_id, source_key)
    );

    create table reputation_projections (
        score integer not null,
        identity_synced_version bigint not null,
        job_synced_version bigint not null,
        source_version bigint not null,
        version bigint,
        provider_id uuid not null,
        last_error varchar(255),
        primary key (provider_id)
    );

    create table reviews (
        is_deleted boolean not null,
        is_published boolean not null,
        rating integer not null,
        created_at timestamp(6) with time zone not null,
        publish_eligible_at timestamp(6) with time zone not null,
        published_at timestamp(6) with time zone,
        updated_at timestamp(6) with time zone not null,
        version bigint not null,
        order_id uuid not null,
        review_id uuid not null,
        reviewee_id uuid not null,
        reviewer_id uuid not null,
        service_id uuid,
        comment TEXT,
        direction varchar(255) not null check (direction in ('CLIENT_TO_PROVIDER','PROVIDER_TO_CLIENT')),
        moderation_status varchar(255) not null check (moderation_status in ('PENDING','APPROVED','REJECTED','HIDDEN')),
        primary key (review_id),
        constraint uq_review_order_direction unique (order_id, direction),
        constraint ck_review_rating_range check (rating >= 1 AND rating <= 5)
    );

    create table reward_quotes (
        needs_review boolean not null,
        points integer not null,
        created_at timestamp(6) with time zone not null,
        expires_at timestamp(6) with time zone not null,
        client_id uuid not null,
        id uuid not null,
        provider_id uuid not null,
        input_hash varchar(64) not null,
        input_payload TEXT not null,
        model_version varchar(255) not null,
        rule_version varchar(255) not null,
        primary key (id)
    );

    create table reward_reviews (
        approved_points integer,
        due_at timestamp(6) with time zone not null,
        requested_at timestamp(6) with time zone not null,
        reviewed_at timestamp(6) with time zone,
        version bigint,
        order_id uuid not null,
        reviewed_by uuid,
        reason varchar(1000),
        status varchar(255) not null,
        primary key (order_id)
    );

    create table reward_snapshots (
        needs_review boolean not null,
        points integer not null,
        locked_at timestamp(6) with time zone not null,
        client_id uuid not null,
        order_id uuid not null,
        provider_id uuid not null,
        input_hash varchar(64) not null,
        model_version varchar(100) not null,
        rule_version varchar(255) not null,
        primary key (order_id)
    );

    create table trust_admin_audit (
        created_at timestamp(6) with time zone not null,
        actor_id uuid not null,
        id uuid not null,
        target_id uuid not null,
        reason varchar(1000) not null,
        action varchar(255) not null,
        actor_role varchar(255),
        after_state varchar(255),
        before_state varchar(255),
        correlation_id varchar(255),
        source varchar(255),
        target_type varchar(255),
        primary key (id)
    );

    create table trust_coordination_locks (
        sequence_value bigint not null,
        lock_key varchar(200) not null,
        primary key (lock_key)
    );

    create index idx_dispute_order 
       on disputes (order_id);

    create index idx_dispute_client 
       on disputes (client_id, created_at);

    create index idx_dispute_provider 
       on disputes (provider_id, created_at);

    create index idx_trust_outbox_due 
       on outbox_events (status, next_attempt_at);

    create index idx_report_target 
       on reports (target_type, target_id);

    create index idx_report_reporter 
       on reports (reporter_id, created_at);

    create index idx_review_order 
       on reviews (order_id);

    create index idx_review_reviewee_published 
       on reviews (reviewee_id, direction, is_published, moderation_status, created_at);

    create index idx_review_service_published 
       on reviews (service_id, direction, is_published, moderation_status, created_at);

    create index idx_review_reviewer 
       on reviews (reviewer_id, created_at);

    create index idx_review_due_publish 
       on reviews (is_published, publish_eligible_at);

COMMIT;
\endif
\endif
SELECT :'workgo_service' = 'identity' AS workgo_apply \gset
\if :workgo_apply
-- BEGIN WORKGO SCRIPT: identity-service/src/main/resources/db/manual/20261119_provider_snapshot_defaults.sql
-- Run before deployment against identity_db. Replaces the local docs/sql/identity-service/001_rating_snapshot_version.sql.
BEGIN;
ALTER TABLE provider_profiles
    ADD COLUMN IF NOT EXISTS rating_aggregate_version BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_financially_restricted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS financial_restriction_version BIGINT NOT NULL DEFAULT 0;
UPDATE provider_profiles SET rating_aggregate_version = 0 WHERE rating_aggregate_version IS NULL;
UPDATE provider_profiles SET is_financially_restricted = FALSE WHERE is_financially_restricted IS NULL;
UPDATE provider_profiles SET financial_restriction_version = 0 WHERE financial_restriction_version IS NULL;
ALTER TABLE provider_profiles
    ALTER COLUMN rating_aggregate_version SET DEFAULT 0,
    ALTER COLUMN rating_aggregate_version SET NOT NULL,
    ALTER COLUMN is_financially_restricted SET DEFAULT FALSE,
    ALTER COLUMN is_financially_restricted SET NOT NULL,
    ALTER COLUMN financial_restriction_version SET DEFAULT 0,
    ALTER COLUMN financial_restriction_version SET NOT NULL;
COMMIT;
-- END WORKGO SCRIPT: identity-service/src/main/resources/db/manual/20261119_provider_snapshot_defaults.sql
-- BEGIN WORKGO SCRIPT: identity-service/src/main/resources/db/manual/20261125_refresh_sessions.sql
-- Additive DEV-04 migration; apply before starting Identity with the new session code.
-- Existing JWTs without sessionId are deliberately rejected; users sign in again.
-- Manual order: after 20261119_provider_snapshot_defaults.sql; DEV-29 owns upgrade/restore acceptance.
BEGIN;
CREATE TABLE IF NOT EXISTS refresh_sessions (
    token_hash VARCHAR(64) PRIMARY KEY,
    family_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(user_id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    auth_time BIGINT NOT NULL,
    auth_version BIGINT NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    rotated_to VARCHAR(64)
);
CREATE INDEX IF NOT EXISTS ix_refresh_family ON refresh_sessions(family_id);
CREATE INDEX IF NOT EXISTS ix_refresh_user ON refresh_sessions(user_id);
COMMIT;
-- END WORKGO SCRIPT: identity-service/src/main/resources/db/manual/20261125_refresh_sessions.sql
-- BEGIN WORKGO SCRIPT: identity-service/src/main/resources/db/manual/dev06-audit-source.sql
-- Apply before this application version; retain historical provenance without inventing actors/traces.
BEGIN;
ALTER TABLE admin_action_logs ADD COLUMN IF NOT EXISTS source varchar(255);
UPDATE admin_action_logs SET source='LEGACY_IDENTITY' WHERE source IS NULL;
COMMIT;
-- END WORKGO SCRIPT: identity-service/src/main/resources/db/manual/dev06-audit-source.sql
-- BEGIN WORKGO SCRIPT: identity-service/src/main/resources/db/manual/dev07-file-metadata.sql
BEGIN;
ALTER TABLE verification_documents ADD COLUMN IF NOT EXISTS status varchar(32) DEFAULT 'READY';
UPDATE verification_documents SET status='READY' WHERE status IS NULL;
COMMIT;
-- END WORKGO SCRIPT: identity-service/src/main/resources/db/manual/dev07-file-metadata.sql

\endif

SELECT :'workgo_service' = 'catalog' AS workgo_apply \gset
\if :workgo_apply
-- BEGIN WORKGO SCRIPT: catalog-service/src/main/resources/db/manual/20261119_service_snapshot_default.sql
-- Run before deployment against catalog_db. Replaces the local docs/sql/catalog-service/001_rating_snapshot_version.sql.
BEGIN;
ALTER TABLE services ADD COLUMN IF NOT EXISTS rating_aggregate_version BIGINT NOT NULL DEFAULT 0;
UPDATE services SET rating_aggregate_version = 0 WHERE rating_aggregate_version IS NULL;
ALTER TABLE services
    ALTER COLUMN rating_aggregate_version SET DEFAULT 0,
    ALTER COLUMN rating_aggregate_version SET NOT NULL;
COMMIT;
-- END WORKGO SCRIPT: catalog-service/src/main/resources/db/manual/20261119_service_snapshot_default.sql
-- BEGIN WORKGO SCRIPT: catalog-service/src/main/resources/db/manual/dev06-audit-source.sql
-- Apply before this application version; retain historical provenance without inventing actors/traces.
BEGIN;
ALTER TABLE admin_action_logs ADD COLUMN IF NOT EXISTS source varchar(255);
UPDATE admin_action_logs SET source='LEGACY_CATALOG' WHERE source IS NULL;
COMMIT;
-- END WORKGO SCRIPT: catalog-service/src/main/resources/db/manual/dev06-audit-source.sql
-- BEGIN WORKGO SCRIPT: catalog-service/src/main/resources/db/manual/dev07-file-metadata.sql
BEGIN;
ALTER TABLE service_medias ADD COLUMN IF NOT EXISTS status varchar(32) DEFAULT 'READY';
UPDATE service_medias SET status='READY' WHERE status IS NULL;
COMMIT;
-- END WORKGO SCRIPT: catalog-service/src/main/resources/db/manual/dev07-file-metadata.sql

\endif

SELECT :'workgo_service' = 'job' AS workgo_apply \gset
\if :workgo_apply
-- BEGIN WORKGO SCRIPT: job-service/src/main/resources/db/manual/dev06-audit-metadata.sql
-- DEV-06 additive migration. Run as the owning schema migration role before this source version.
-- Preserve historical actor IDs/reasons/timestamps. No actor role or trace is inferred from current users.
BEGIN;
ALTER TABLE job_admin_audit ADD COLUMN IF NOT EXISTS actor_role varchar(255);
ALTER TABLE job_admin_audit ADD COLUMN IF NOT EXISTS correlation_id varchar(255);
ALTER TABLE job_admin_audit ADD COLUMN IF NOT EXISTS source varchar(255);
ALTER TABLE job_admin_audit ADD COLUMN IF NOT EXISTS target_type varchar(255);
ALTER TABLE job_admin_audit ADD COLUMN IF NOT EXISTS action varchar(255);
ALTER TABLE job_admin_audit ADD COLUMN IF NOT EXISTS before_state text;
ALTER TABLE job_admin_audit ADD COLUMN IF NOT EXISTS after_state text;
UPDATE job_admin_audit SET action=CASE WHEN after_hidden THEN 'JOB_HIDDEN' ELSE 'JOB_RESTORED' END WHERE action IS NULL;
UPDATE job_admin_audit SET before_state=json_build_object('moderationHidden',before_hidden)::text WHERE before_state IS NULL;
UPDATE job_admin_audit SET after_state=json_build_object('moderationHidden',after_hidden)::text WHERE after_state IS NULL;
UPDATE job_admin_audit SET actor_role='LEGACY_UNKNOWN' WHERE actor_role IS NULL;
UPDATE job_admin_audit SET source='LEGACY_JOB' WHERE source IS NULL;
UPDATE job_admin_audit SET target_type='JOB' WHERE target_type IS NULL;
CREATE INDEX IF NOT EXISTS ix_job_audit_actor_time ON job_admin_audit(actor_id,created_at,id);
CREATE INDEX IF NOT EXISTS ix_job_audit_target_time ON job_admin_audit(target_id,created_at,id);
COMMIT;
-- Retention: append-only for 24 calendar months minimum; legal/evidence holds override expiry.
-- Archive only through an authorized offline operator workflow with count/hash/restore verification.
-- Application HTTP exposes no update/delete, and its repository exposes save/read only.
-- END WORKGO SCRIPT: job-service/src/main/resources/db/manual/dev06-audit-metadata.sql
-- BEGIN WORKGO SCRIPT: job-service/src/main/resources/db/manual/dev06-outbox-correlation.sql
-- Additive. Legacy null traces use an explicitly named legacy delivery trace; no original trace is inferred.
ALTER TABLE proposal_order_outbox ADD COLUMN IF NOT EXISTS correlation_id varchar(64);
-- END WORKGO SCRIPT: job-service/src/main/resources/db/manual/dev06-outbox-correlation.sql
-- BEGIN WORKGO SCRIPT: job-service/src/main/resources/db/manual/dev07-file-metadata.sql
BEGIN;
ALTER TABLE job_attachments ADD COLUMN IF NOT EXISTS sha256 varchar(64);
ALTER TABLE job_attachments ADD COLUMN IF NOT EXISTS storage_key varchar(255);
ALTER TABLE job_attachments ADD COLUMN IF NOT EXISTS uploaded_by uuid;
ALTER TABLE job_attachments ADD COLUMN IF NOT EXISTS status varchar(32) DEFAULT 'READY';
UPDATE job_attachments SET status='READY' WHERE status IS NULL;
COMMIT;
-- END WORKGO SCRIPT: job-service/src/main/resources/db/manual/dev07-file-metadata.sql
-- DEV-23 creation receipts: nullable for historical jobs; never infer old keys or reset a draft.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS creation_key varchar(128);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS creation_hash varchar(64);
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='jobs'::regclass AND conname='uk_job_creation_key') THEN
        ALTER TABLE jobs ADD CONSTRAINT uk_job_creation_key UNIQUE (client_id, creation_key);
    END IF;
END $$;
\endif

SELECT :'workgo_service' = 'order' AS workgo_apply \gset
\if :workgo_apply
-- BEGIN WORKGO SCRIPT: order-service/src/main/resources/db/manual/20261119_order_creation_retry.sql
-- Apply before deploying the order creation retry change; existing orders keep NULL keys.
BEGIN;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key varchar(128);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS creation_request_hash varchar(64);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                   WHERE conrelid = 'orders'::regclass AND conname = 'uq_order_client_creation_key') THEN
        ALTER TABLE orders ADD CONSTRAINT uq_order_client_creation_key UNIQUE (client_id, idempotency_key);
    END IF;
END $$;
COMMIT;

-- Rollback: deploy the previous application, retaining these nullable columns and index.
-- They are backward compatible; keeping the receipt keys preserves safe retries on re-deploy.
-- END WORKGO SCRIPT: order-service/src/main/resources/db/manual/20261119_order_creation_retry.sql
-- BEGIN WORKGO SCRIPT: order-service/src/main/resources/db/manual/dev06-outbox-correlation.sql
-- Additive. Legacy null traces use an explicitly named legacy delivery trace; no original trace is inferred.
ALTER TABLE order_completed_outbox ADD COLUMN IF NOT EXISTS correlation_id varchar(64);
-- END WORKGO SCRIPT: order-service/src/main/resources/db/manual/dev06-outbox-correlation.sql
-- BEGIN WORKGO SCRIPT: order-service/src/main/resources/db/manual/dev07-file-metadata.sql
BEGIN;
ALTER TABLE stored_files ADD COLUMN IF NOT EXISTS status varchar(32) DEFAULT 'READY';
ALTER TABLE stored_files ADD COLUMN IF NOT EXISTS evidence_hold boolean NOT NULL DEFAULT false;
ALTER TABLE stored_files ADD COLUMN IF NOT EXISTS retention_until timestamp with time zone;
UPDATE stored_files SET status='READY' WHERE status IS NULL;
UPDATE stored_files SET evidence_hold=(context = 'WORK_EVIDENCE') WHERE evidence_hold IS NULL;
UPDATE stored_files SET retention_until=created_at + INTERVAL '90' DAY WHERE retention_until IS NULL;
COMMIT;
-- END WORKGO SCRIPT: order-service/src/main/resources/db/manual/dev07-file-metadata.sql
-- BEGIN WORKGO SCRIPT: order-service/DEV-09-input-agreement.sql
BEGIN;
ALTER TABLE order_snapshots ADD COLUMN IF NOT EXISTS reward_quote_ref varchar(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS input_support_reason varchar(255);
ALTER TABLE order_agreement_versions ADD COLUMN IF NOT EXISTS input_requirements text;
ALTER TABLE order_agreement_versions ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE order_agreement_versions ADD COLUMN IF NOT EXISTS payment_method varchar(255);
ALTER TABLE order_agreement_versions ADD COLUMN IF NOT EXISTS fee_policy_version_id uuid;
ALTER TABLE order_agreement_versions ADD COLUMN IF NOT EXISTS reward_quote_ref varchar(255);
ALTER TABLE order_agreement_versions ADD COLUMN IF NOT EXISTS policy_version varchar(255);
ALTER TABLE order_amendments ADD COLUMN IF NOT EXISTS payment_receipt_id uuid;
ALTER TABLE order_amendments ADD COLUMN IF NOT EXISTS payment_adjusted_at timestamptz;
ALTER TABLE order_amendments ADD COLUMN IF NOT EXISTS old_scope text;
ALTER TABLE order_amendments ADD COLUMN IF NOT EXISTS old_price numeric(38,2);
ALTER TABLE order_amendments ADD COLUMN IF NOT EXISTS old_duration_days integer;
CREATE TABLE IF NOT EXISTS order_input_checklists (
 id uuid PRIMARY KEY, order_id uuid NOT NULL REFERENCES orders(order_id), checklist_version integer NOT NULL,
 agreement_version integer NOT NULL, requirements text NOT NULL, provider_confirmed_at timestamptz NOT NULL,
 client_confirmed_at timestamptz, confirmation_base_version bigint,
 submitted_values text, submitted_at timestamptz, response_due_at timestamptz, accepted_at timestamptz,
 missing_reason text, reminder_24_at timestamptz, reminder_72_at timestamptz, escalated_at timestamptz,
 created_at timestamptz NOT NULL, version bigint NOT NULL DEFAULT 0,
 UNIQUE(order_id,checklist_version)
);
CREATE TABLE IF NOT EXISTS order_input_notices (
 id uuid PRIMARY KEY, order_id uuid NOT NULL REFERENCES orders(order_id), recipient_id uuid NOT NULL,
 type varchar(255) NOT NULL, next_attempt_at timestamptz NOT NULL, acknowledged_at timestamptz,
 attempts integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_order_input_notice_pending ON order_input_notices(next_attempt_at) WHERE acknowledged_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_order_input_support ON orders(confirmed_at) WHERE input_support_reason IS NOT NULL;
-- Do not backfill absent historical checklists as accepted or infer no-input consent.
COMMIT;
-- END WORKGO SCRIPT: order-service/DEV-09-input-agreement.sql

\endif

SELECT :'workgo_service' = 'payment' AS workgo_apply \gset
\if :workgo_apply
-- BEGIN WORKGO SCRIPT: payment-service/src/main/resources/db/manual/20261119_escrow_funding_default.sql
-- Legacy escrow rows were gateway-funded; existing WALLET values are preserved.
BEGIN;
ALTER TABLE escrow_accounts ADD COLUMN IF NOT EXISTS funding_source VARCHAR(255);
UPDATE escrow_accounts SET funding_source = 'GATEWAY'
WHERE funding_source IS NULL AND payment_id IS NOT NULL
    AND (to_jsonb(escrow_accounts)->>'hold_transaction_id') IS NULL;
-- Null sources without unambiguous legacy payment evidence fail here; reconcile their receipts first.
ALTER TABLE escrow_accounts
    ALTER COLUMN funding_source SET DEFAULT 'GATEWAY',
    ALTER COLUMN funding_source SET NOT NULL;
COMMIT;
-- END WORKGO SCRIPT: payment-service/src/main/resources/db/manual/20261119_escrow_funding_default.sql
-- BEGIN WORKGO SCRIPT: payment-service/src/main/resources/db/manual/dev06-audit-source.sql
-- Apply before this application version; retain historical provenance without inventing actors/traces.
BEGIN;
ALTER TABLE admin_action_logs ADD COLUMN IF NOT EXISTS source varchar(255);
UPDATE admin_action_logs SET source='LEGACY_PAYMENT' WHERE source IS NULL;
COMMIT;
-- END WORKGO SCRIPT: payment-service/src/main/resources/db/manual/dev06-audit-source.sql
-- DEV-09: immutable fee payload for amendment receipt replay.
ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS command_fee numeric(38,2);
\endif

SELECT :'workgo_service' = 'trust' AS workgo_apply \gset
\if :workgo_apply
-- BEGIN WORKGO SCRIPT: trust-service/src/main/resources/db/manual/dev06-audit-metadata.sql
-- DEV-06 additive migration. Run as the owning schema migration role before this source version.
-- Preserve historical actor IDs/reasons/timestamps. No actor role or trace is inferred from current users.
BEGIN;
ALTER TABLE trust_admin_audit ADD COLUMN IF NOT EXISTS actor_role varchar(255);
ALTER TABLE trust_admin_audit ADD COLUMN IF NOT EXISTS correlation_id varchar(255);
ALTER TABLE trust_admin_audit ADD COLUMN IF NOT EXISTS source varchar(255);
ALTER TABLE trust_admin_audit ADD COLUMN IF NOT EXISTS target_type varchar(255);
UPDATE trust_admin_audit SET actor_role='LEGACY_UNKNOWN' WHERE actor_role IS NULL;
UPDATE trust_admin_audit SET source='LEGACY_TRUST' WHERE source IS NULL;
UPDATE trust_admin_audit SET target_type=CASE WHEN action LIKE 'REVIEW_%' THEN 'REVIEW' WHEN action LIKE 'REPORT_%' THEN 'REPORT' WHEN action LIKE 'DISPUTE_%' OR action='DECISION_RETRY' THEN 'DISPUTE' ELSE 'LEGACY_UNKNOWN' END WHERE target_type IS NULL;
CREATE INDEX IF NOT EXISTS ix_trust_audit_actor_time ON trust_admin_audit(actor_id,created_at,id);
CREATE INDEX IF NOT EXISTS ix_trust_audit_target_time ON trust_admin_audit(target_id,created_at,id);
COMMIT;
-- Retention: append-only for 24 calendar months minimum; legal/evidence holds override expiry.
-- Archive only through an authorized offline operator workflow with count/hash/restore verification.
-- Application HTTP exposes no update/delete, and its repository exposes save/read only.
-- END WORKGO SCRIPT: trust-service/src/main/resources/db/manual/dev06-audit-metadata.sql
-- BEGIN WORKGO SCRIPT: trust-service/src/main/resources/db/manual/dev06-outbox-correlation.sql
-- Additive. Legacy null traces use an explicitly named legacy delivery trace; no original trace is inferred.
ALTER TABLE outbox_events ADD COLUMN IF NOT EXISTS correlation_id varchar(64);
ALTER TABLE dispute_decisions ADD COLUMN IF NOT EXISTS correlation_id varchar(64);
-- END WORKGO SCRIPT: trust-service/src/main/resources/db/manual/dev06-outbox-correlation.sql
-- BEGIN WORKGO SCRIPT: trust-service/src/main/resources/db/manual/dev07-file-metadata.sql
BEGIN;
ALTER TABLE private_evidence ADD COLUMN IF NOT EXISTS storage_key varchar(255);
ALTER TABLE private_evidence ADD COLUMN IF NOT EXISTS original_name varchar(255);
ALTER TABLE private_evidence ADD COLUMN IF NOT EXISTS status varchar(32) DEFAULT 'READY';
ALTER TABLE private_evidence ADD COLUMN IF NOT EXISTS evidence_hold boolean NOT NULL DEFAULT true;
ALTER TABLE private_evidence ADD COLUMN IF NOT EXISTS retention_until timestamp with time zone;
UPDATE private_evidence SET storage_key=id::text WHERE storage_key IS NULL;
UPDATE private_evidence SET original_name='evidence' WHERE original_name IS NULL;
UPDATE private_evidence SET status='READY' WHERE status IS NULL;
UPDATE private_evidence SET retention_until=created_at + INTERVAL '90' DAY WHERE retention_until IS NULL;
COMMIT;
-- END WORKGO SCRIPT: trust-service/src/main/resources/db/manual/dev07-file-metadata.sql
-- BEGIN WORKGO SCRIPT: trust-service/src/main/resources/db/manual/dev08-dispute-sla.sql
BEGIN;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS client_evidence_ack_at timestamp(6) with time zone;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS provider_evidence_ack_at timestamp(6) with time zone;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS client_evidence_extended_until timestamp(6) with time zone;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS provider_evidence_extended_until timestamp(6) with time zone;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS client_extension_used boolean NOT NULL DEFAULT false;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS provider_extension_used boolean NOT NULL DEFAULT false;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS client_extension_reason varchar(1000);
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS provider_extension_reason varchar(1000);
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS client_extension_base_version bigint;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS provider_extension_base_version bigint;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS intake_sla_due_at timestamp(6) with time zone;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS intake_escalated_at timestamp(6) with time zone;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS decision_sla_due_at timestamp(6) with time zone;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS decision_escalated_at timestamp(6) with time zone;
UPDATE disputes SET intake_sla_due_at = created_at + INTERVAL '24' HOUR WHERE intake_sla_due_at IS NULL AND created_at IS NOT NULL;
COMMIT;
-- END WORKGO SCRIPT: trust-service/src/main/resources/db/manual/dev08-dispute-sla.sql
\endif


-- MIGRATION NOTES (formerly catalog-service/src/main/resources/db/manual/README.md)
-- Run `20261119_service_snapshot_default.sql` with `psql -v ON_ERROR_STOP=1 -f <script>` against Catalog's database before deployment; back up the database first. The script is manual, transactional and safe to run again. It includes the earlier local `docs/sql/catalog-service/001_rating_snapshot_version.sql`. Existing ratings and non-null aggregate versions are preserved; only missing versions start at 0.
-- 
-- For application rollback, keep the additive column and default. Older binaries ignore it and can still insert services. Do not drop the version column or reset values because this loses replay protection. A failure before `COMMIT` rolls the SQL transaction back; no service rows are deleted.

-- MIGRATION NOTES (formerly identity-service/src/main/resources/db/manual/README.md)
-- Run `20261119_provider_snapshot_defaults.sql` with `psql -v ON_ERROR_STOP=1 -f <script>` against Identity's database before deployment; back up the database first. The script is manual, transactional and safe to run again. It includes the earlier local `docs/sql/identity-service/001_rating_snapshot_version.sql` and also covers financial restriction snapshots. Existing non-null versions, restrictions and rating values are preserved. Only missing snapshots start at version 0; subsequent Payment/Trust snapshots remain authoritative.
-- 
-- For application rollback, keep these additive columns and defaults. Older binaries ignore them and can still insert profiles. Do not drop snapshot columns or reset versions: this would lose replay protection. A failure before `COMMIT` rolls the SQL transaction back; no profile or user rows are deleted.

-- MIGRATION NOTES (formerly payment-service/src/main/resources/db/manual/README.md)
-- Run `20261119_escrow_funding_default.sql` with `psql -v ON_ERROR_STOP=1 -f <script>` against Payment's database before deployment; back up the database first. The script is manual, transactional and safe to run again. Escrows from the version before wallet funding used a gateway payment. Missing sources become `GATEWAY` only with a non-null payment reference and no wallet hold transaction reference. Existing `WALLET`/`GATEWAY` values, amounts and statuses are preserved. Unknown sources without this legacy payment evidence fail the final NOT NULL check and roll the script back. Reconcile those rows against their payment/wallet receipts before retrying; never infer wallet funding solely from a missing payment reference.
-- 
-- For application rollback, keep the additive column and default. Only roll back to binaries supporting wallet-funded escrows while `WALLET` records exist. Do not drop funding information or alter balances/statuses. A failure before `COMMIT` rolls the SQL transaction back; no payment or escrow rows are deleted.

SELECT :'workgo_service' = 'order' AS workgo_apply \gset
\if :workgo_apply
-- DEV-10 / order database: additive revision history and bilateral repair deadlines.
ALTER TABLE revision_requests ADD COLUMN IF NOT EXISTS delivery_version integer;
ALTER TABLE revision_requests ADD COLUMN IF NOT EXISTS agreement_version integer;
ALTER TABLE revision_requests ADD COLUMN IF NOT EXISTS scope_snapshot text;
ALTER TABLE revision_requests ADD COLUMN IF NOT EXISTS criteria_snapshot text;
ALTER TABLE revision_requests ADD COLUMN IF NOT EXISTS response_due_at timestamptz;
ALTER TABLE revision_requests ADD COLUMN IF NOT EXISTS deadline_agreement_due_at timestamptz;
ALTER TABLE revision_requests ADD COLUMN IF NOT EXISTS responded_at timestamptz;
ALTER TABLE revision_requests ADD COLUMN IF NOT EXISTS provider_response text;
ALTER TABLE revision_requests ADD COLUMN IF NOT EXISTS proposed_repair_deadline timestamptz;
ALTER TABLE revision_requests ADD COLUMN IF NOT EXISTS agreed_repair_deadline timestamptz;
ALTER TABLE revision_requests ADD COLUMN IF NOT EXISTS deadline_agreed_at timestamptz;
CREATE TABLE IF NOT EXISTS revision_criterion_refs (
    revision_request_id uuid NOT NULL REFERENCES revision_requests(revision_request_id),
    ref_index integer NOT NULL,
    criterion_ref varchar(255),
    PRIMARY KEY (revision_request_id, ref_index)
);

-- Existing Hibernate schemas may constrain the old enum values. Replace only single-column status checks.
DO $$
DECLARE status_check record;
BEGIN
  FOR status_check IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'revision_requests'::regclass AND contype = 'c'
      AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'revision_requests'::regclass AND attname = 'status')]::smallint[]
  LOOP
    EXECUTE format('ALTER TABLE revision_requests DROP CONSTRAINT %I', status_check.conname);
  END LOOP;
END $$;
ALTER TABLE revision_requests ADD CONSTRAINT revision_requests_status_check
    CHECK (status IN ('OPEN','RESPONDED','AGREED','RESOLVED','REJECTED'));


\endif

SELECT :'workgo_service' = 'order' AS workgo_apply \gset
\if :workgo_apply
-- DEV-11 / ORDER DATABASE ONLY. Run this block separately on the Order database.
BEGIN;
CREATE TABLE IF NOT EXISTS order_timer_states (
    order_id uuid PRIMARY KEY REFERENCES orders(order_id),
    policy_version varchar(255) NOT NULL DEFAULT 'ACCEPTANCE_V1',
    timer_version bigint NOT NULL DEFAULT 0,
    lock_version bigint,
    submission_id varchar(255), started_at timestamptz, due_at timestamptz,
    remaining_seconds bigint NOT NULL DEFAULT 0, paused_at timestamptz,
    total_paused_seconds bigint NOT NULL DEFAULT 0,
    requires_new_delivery boolean NOT NULL DEFAULT false,
    extension_used boolean NOT NULL DEFAULT false, notification_ack_at timestamptz, accepted_at timestamptz
);
CREATE TABLE IF NOT EXISTS order_timer_pauses (
    order_id uuid NOT NULL REFERENCES order_timer_states(order_id),
    source_key varchar(255) NOT NULL, paused_at timestamptz,
    PRIMARY KEY(order_id,source_key)
);
CREATE TABLE IF NOT EXISTS order_timer_released (
    order_id uuid NOT NULL REFERENCES order_timer_states(order_id),
    source_key varchar(255) NOT NULL, PRIMARY KEY(order_id,source_key)
);
CREATE TABLE IF NOT EXISTS order_timer_pause_durations (
    order_id uuid NOT NULL REFERENCES order_timer_states(order_id),
    source_key varchar(255) NOT NULL, elapsed_seconds bigint,
    PRIMARY KEY(order_id,source_key)
);
CREATE TABLE IF NOT EXISTS order_timer_receipts (
    command_id uuid PRIMARY KEY, order_id uuid NOT NULL REFERENCES orders(order_id),
    source_key varchar(255) NOT NULL, require_new_delivery boolean NOT NULL DEFAULT false,
    expected_version bigint, timer_version bigint NOT NULL, paused boolean NOT NULL,
    resume_at timestamptz, requires_new_delivery boolean NOT NULL
);
CREATE TABLE IF NOT EXISTS order_timer_notices (
    id uuid PRIMARY KEY, order_id uuid NOT NULL REFERENCES orders(order_id),
    recipient_id uuid NOT NULL, submission_id varchar(255) NOT NULL, type varchar(255) NOT NULL,
    acknowledged_at timestamptz, next_attempt_at timestamptz NOT NULL,
    attempts integer NOT NULL DEFAULT 0, obsolete boolean NOT NULL DEFAULT false, deadline_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_timer_notice_due ON order_timer_notices(next_attempt_at)
    WHERE acknowledged_at IS NULL AND obsolete=false;
COMMIT;
-- Timer rows for existing deliveries are initialized lazily under the Order lock.
-- Legacy deliveries cannot auto-accept until their real notifications/evidence pass guards.

\endif

SELECT :'workgo_service' = 'trust' AS workgo_apply \gset
\if :workgo_apply
-- DEV-11 / TRUST DATABASE ONLY. Run this block separately on the Trust database.
BEGIN;
ALTER TABLE outbox_events ALTER COLUMN delivery_result TYPE text;
ALTER TABLE dispute_decisions ADD COLUMN IF NOT EXISTS timer_status varchar(255) NOT NULL DEFAULT 'PENDING';
ALTER TABLE dispute_decisions ADD COLUMN IF NOT EXISTS timer_result text;
UPDATE dispute_decisions SET timer_status='SKIPPED'
    WHERE operation<>'REJECT' AND execution_status='COMPLETED' AND timer_status='PENDING';
-- Legacy REJECT conclusions had no Order timer receipt. Require explicit reconciliation/retry.
UPDATE dispute_decisions SET execution_status='NEEDS_RECONCILIATION',order_status='PENDING',payment_status='PENDING',
    payment_result=NULL,lease_token=NULL,attempts=0,last_error='LEGACY_REJECT_RESUME_ACK_REQUIRED',timer_status='PENDING'
    WHERE operation='REJECT' AND execution_status='COMPLETED' AND order_status='SKIPPED' AND timer_result IS NULL;
COMMIT;

\endif

SELECT :'workgo_service' = 'order' AS workgo_apply \gset
\if :workgo_apply
-- DEV-12 / ORDER DATABASE ONLY. Manual local migration, not applied by the coding task.
BEGIN;
CREATE TABLE IF NOT EXISTS preview_sessions (
    id uuid PRIMARY KEY, order_id uuid NOT NULL REFERENCES orders(order_id), active_slot integer,
    request_key uuid NOT NULL, requester_id uuid, host_user_id uuid, schedule_proposer_id uuid,
    submission_id varchar(255), version bigint NOT NULL DEFAULT 0, lock_version bigint,
    status varchar(255) NOT NULL DEFAULT 'REQUESTED', created_at timestamptz,
    response_due_at timestamptz, schedule_due_at timestamptz, scheduled_at timestamptz,
    pause_active boolean NOT NULL DEFAULT false, attempt_id uuid, room_status varchar(255) NOT NULL DEFAULT 'NOT_CREATED',
    space_name varchar(255) UNIQUE, meeting_uri varchar(255), last_error varchar(255), closed_at timestamptz,
    UNIQUE(order_id,active_slot), UNIQUE(order_id,request_key), CHECK(active_slot IS NULL OR active_slot=1)
);
CREATE INDEX IF NOT EXISTS idx_preview_pending ON preview_sessions(status,response_due_at,scheduled_at) WHERE active_slot=1;
CREATE TABLE IF NOT EXISTS preview_events (
    id uuid PRIMARY KEY, preview_id uuid REFERENCES preview_sessions(id), actor_id uuid, type varchar(255),
    note varchar(2000), occurred_at timestamptz, preview_version bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_preview_events ON preview_events(preview_id,occurred_at);
CREATE TABLE IF NOT EXISTS meet_authorizations (
    user_id uuid PRIMARY KEY, version bigint, encrypted_refresh_token text, state varchar(255),
    state_expires_at timestamptz, scope varchar(255)
);
COMMIT;
-- Refresh tokens are encrypted with ORDER_MEET_TOKEN_KEY/SALT, never returned by the API.
-- Back up encryption credentials separately. No Google tokens or fake Meet URLs are seeded.

\endif

SELECT :'workgo_service' = 'order' AS workgo_apply \gset
\if :workgo_apply
-- DEV-13 / ORDER DATABASE ONLY. Manual local migration for cancellation case linkage and lateness assessment.
BEGIN;
ALTER TABLE cancellation_requests ADD COLUMN IF NOT EXISTS case_id uuid;
ALTER TABLE cancellation_requests ADD COLUMN IF NOT EXISTS decision_id uuid;
ALTER TABLE cancellation_requests ADD COLUMN IF NOT EXISTS execution_status varchar(64);
ALTER TABLE cancellation_requests ADD COLUMN IF NOT EXISTS counterpart_agreed boolean;
ALTER TABLE cancellation_requests ADD COLUMN IF NOT EXISTS fee_exempt_before_24h boolean;
ALTER TABLE cancellation_requests ADD COLUMN IF NOT EXISTS projected_cancellation_fee bigint;

CREATE TABLE IF NOT EXISTS order_lateness_states (
    order_id uuid PRIMARY KEY REFERENCES orders(order_id),
    deadline_snapshot timestamptz,
    progress_responded_at timestamptz,
    progress_summary text,
    progress_evidence_ref varchar(500),
    proposed_remedy text,
    proposed_remedy_at timestamptz,
    verification_opened boolean NOT NULL DEFAULT false,
    verification_opened_at timestamptz,
    verification_notice_id uuid,
    verification_ack_at timestamptz,
    explanation_due_at timestamptz,
    explanation_submitted_at timestamptz,
    explanation_text text,
    explanation_evidence_ref varchar(500),
    escalated_7d boolean NOT NULL DEFAULT false,
    escalated_7d_at timestamptz,
    version bigint
);
COMMIT;

\endif

SELECT :'workgo_service' = 'trust' AS workgo_apply \gset
\if :workgo_apply
-- DEV-13 / TRUST DATABASE ONLY. Manual local migration for onsite incidents, bilateral reschedules and contact notices.
BEGIN;
CREATE TABLE IF NOT EXISTS onsite_incidents (
    incident_id uuid PRIMARY KEY,
    order_id uuid NOT NULL UNIQUE,
    dispute_id uuid,
    client_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    incident_type varchar(100),
    status varchar(60) NOT NULL DEFAULT 'MONITORING',
    contact_required boolean NOT NULL DEFAULT false,
    contact_attempts integer NOT NULL DEFAULT 0,
    client_contact_attempts integer NOT NULL DEFAULT 0,
    provider_contact_attempts integer NOT NULL DEFAULT 0,
    first_contact_at timestamptz,
    last_contact_at timestamptz,
    original_scheduled_start timestamptz,
    original_scheduled_end timestamptz,
    effective_scheduled_start timestamptz,
    effective_scheduled_end timestamptz,
    proposed_scheduled_start timestamptz,
    proposed_scheduled_end timestamptz,
    reschedule_proposed_by_role varchar(30),
    client_confirmed_reschedule boolean NOT NULL DEFAULT false,
    provider_confirmed_reschedule boolean NOT NULL DEFAULT false,
    reschedule_status varchar(60) DEFAULT 'NONE',
    alleged_fault_party varchar(50),
    force_majeure boolean NOT NULL DEFAULT false,
    allegation_summary text,
    evidence_url text,
    location_signal varchar(500),
    incident_reported_at timestamptz,
    conclusion_status varchar(60) NOT NULL DEFAULT 'NO_CONCLUSION',
    decision_id uuid,
    concluded_fault_party varchar(50),
    concluded_fault_type varchar(50),
    financial_status varchar(60) NOT NULL DEFAULT 'UNCHANGED',
    applicable_cancellation_fee bigint NOT NULL DEFAULT 0,
    arrival_fee bigint NOT NULL DEFAULT 0,
    version bigint NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_onsite_incident_order ON onsite_incidents(order_id);

CREATE TABLE IF NOT EXISTS onsite_progress_notices (
    notice_id uuid PRIMARY KEY,
    order_id uuid NOT NULL,
    actor_id uuid NOT NULL,
    actor_role varchar(30) NOT NULL,
    notice_type varchar(60) NOT NULL,
    occurred_at timestamptz NOT NULL,
    summary text NOT NULL,
    evidence_url text,
    contact_attempt_no integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_onsite_progress_notices_order ON onsite_progress_notices(order_id, occurred_at);
COMMIT;

\endif

-- DEV-15: Payment receipt metadata and durable cancellation fee reminders.
SELECT :'workgo_service' = 'payment' AS workgo_apply \gset
\if :workgo_apply
BEGIN;
ALTER TABLE settlement_receipts ADD COLUMN IF NOT EXISTS funding_source varchar(30);
ALTER TABLE settlement_receipts ADD COLUMN IF NOT EXISTS fee_policy_version_id uuid;
UPDATE settlement_receipts r SET funding_source = e.funding_source
FROM escrow_accounts e WHERE e.order_id = r.order_id AND r.funding_source IS NULL;
UPDATE settlement_receipts r SET fee_policy_version_id = f.fee_policy_version_id
FROM fee_assessments f WHERE f.fee_assessment_id = r.fee_assessment_id AND r.fee_policy_version_id IS NULL;
CREATE TABLE IF NOT EXISTS fee_reminders (
    id uuid PRIMARY KEY,
    fee_assessment_id uuid NOT NULL,
    milestone varchar(255) NOT NULL,
    due_at timestamptz NOT NULL,
    delivered_at timestamptz,
    cancelled_at timestamptz,
    CONSTRAINT uk_fee_reminder_milestone UNIQUE (fee_assessment_id, milestone)
);
CREATE INDEX IF NOT EXISTS idx_fee_reminder_pending ON fee_reminders (due_at)
WHERE delivered_at IS NULL AND cancelled_at IS NULL;
-- Existing unpaid cancellation fees also receive stable reminders; never send paid debts.
INSERT INTO fee_reminders (id, fee_assessment_id, milestone, due_at)
SELECT md5('FEE_REMINDER:' || f.fee_assessment_id::text || ':' || m.hours::text)::uuid,
       f.fee_assessment_id, m.milestone, f.created_at + m.hours * INTERVAL '1 hour'
FROM fee_assessments f
CROSS JOIN (VALUES ('24H', 24), ('7D', 168)) AS m(milestone, hours)
WHERE f.fee_type = 'CANCELLATION' AND f.status = 'OUTSTANDING'
  AND f.collected_amount < f.amount AND f.charged_user_id IS NOT NULL
ON CONFLICT (fee_assessment_id, milestone) DO NOTHING;
COMMIT;
\endif

SELECT :'workgo_service' = 'payment' AS workgo_apply \gset
\if :workgo_apply
-- DEV-17 / payment_db. Additive upgrade, preserve legacy payouts without guessed beneficiary proof.
ALTER TABLE wallet_payouts ADD COLUMN IF NOT EXISTS payload_hash VARCHAR(64);
ALTER TABLE wallet_payouts ADD COLUMN IF NOT EXISTS verified_beneficiary_id UUID;
-- Existing duplicate references must be reconciled before enabling this index; never discard records.
CREATE UNIQUE INDEX IF NOT EXISTS uq_wallet_payout_external_reference ON wallet_payouts(external_reference);

\endif

SELECT :'workgo_service' = 'order' AS workgo_apply \gset
\if :workgo_apply
-- DEV-18 / order_db; explicit amounts preserve work acceptance separately from receipt.
ALTER TABLE onsite_executions ADD COLUMN IF NOT EXISTS actual_received_amount NUMERIC(38,2);
ALTER TABLE onsite_executions ADD COLUMN IF NOT EXISTS client_cash_paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE onsite_executions ADD COLUMN IF NOT EXISTS client_cash_paid_amount NUMERIC(38,2);
-- Known historical full receipt only; no amounts inferred for unconfirmed receipts.
UPDATE onsite_executions s SET actual_received_amount=o.total_amount
FROM executions e JOIN orders o ON e.order_id=o.order_id
WHERE s.execution_id=e.execution_id AND s.cash_received_at IS NOT NULL AND s.actual_received_amount IS NULL;

\endif

SELECT :'workgo_service' = 'payment' AS workgo_apply \gset
\if :workgo_apply
-- DEV-19 / payment_db; new Job destination is pending for every existing version.
ALTER TABLE financial_restrictions ADD COLUMN IF NOT EXISTS job_synced_version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE financial_restrictions ADD COLUMN IF NOT EXISTS last_error VARCHAR(200);

\endif

-- DB-FINAL additive delta from DEV16; owner identity.
SELECT :'workgo_service' = 'identity' AS workgo_apply \gset
\if :workgo_apply
BEGIN;
create table if not exists provider_recovery_grants (
        approved_at timestamp(6) with time zone not null,
        expires_at timestamp(6) with time zone not null,
        reputation_version bigint not null,
        actor_id uuid not null,
        id uuid not null,
        provider_id uuid not null,
        reason varchar(1000) not null,
        primary key (id)
    );
create table if not exists provider_reputation_snapshots (
        score integer not null,
        low_score_since timestamp(6) with time zone,
        source_version bigint not null,
        version bigint,
        provider_id uuid not null,
        policy_version varchar(255),
        primary key (provider_id)
    );
create table if not exists provider_sanctions (
        effective_at timestamp(6) with time zone not null,
        expires_at timestamp(6) with time zone,
        revoked_at timestamp(6) with time zone,
        version bigint,
        actor_id uuid not null,
        id uuid not null,
        provider_id uuid not null,
        revoked_by uuid,
        user_id uuid not null,
        reference varchar(200) not null,
        reason varchar(1000) not null,
        revocation_reason varchar(1000),
        scope varchar(255) not null,
        primary key (id)
    );
create table if not exists provider_score_reviews (
        score integer not null,
        reputation_version bigint not null,
        reviewed_at timestamp(6) with time zone not null,
        actor_id uuid not null,
        id uuid not null,
        provider_id uuid not null,
        sanction_id uuid,
        user_id uuid not null,
        outcome varchar(32) not null,
        reference varchar(200) not null,
        reason varchar(1000) not null,
        primary key (id),
        constraint uk_provider_score_review_version unique (provider_id, reputation_version)
    );

create table if not exists provider_trust_events (
        approved_at timestamp(6) with time zone not null,
        delivered_at timestamp(6) with time zone,
        version bigint,
        provider_id uuid not null,
        user_id uuid not null,
        last_error varchar(255),
        primary key (provider_id)
    );
create table if not exists sanction_appeals (
        reviewed_at timestamp(6) with time zone,
        submitted_at timestamp(6) with time zone not null,
        version bigint,
        id uuid not null,
        reviewed_by uuid,
        sanction_id uuid not null,
        user_id uuid not null,
        decision_reason varchar(1000),
        explanation varchar(2000) not null,
        status varchar(255) not null,
        primary key (id),
        unique (sanction_id, user_id)
    );
create table if not exists sanction_projections (
        blocked boolean not null,
        catalog_synced_version bigint not null,
        job_synced_version bigint not null,
        order_synced_version bigint not null,
        source_version bigint not null,
        version bigint,
        provider_id uuid not null,
        last_error varchar(255),
        primary key (provider_id)
    );
create table if not exists security_support_requests (
        created_at timestamp(6) with time zone not null,
        version bigint,
        id uuid not null,
        contact varchar(254) not null,
        description varchar(2000) not null,
        status varchar(255) not null,
        primary key (id)
    );
COMMIT;
\endif

-- DB-FINAL additive delta from DEV16; owner catalog.
SELECT :'workgo_service' = 'catalog' AS workgo_apply \gset
\if :workgo_apply
BEGIN;
create table if not exists provider_restriction_projections (
        blocked boolean not null,
        source_version bigint not null,
        version bigint,
        provider_id uuid,
        id varchar(255) not null,
        source varchar(255),
        primary key (id)
    );
COMMIT;
\endif

-- DB-FINAL additive delta from DEV16; owner job.
SELECT :'workgo_service' = 'job' AS workgo_apply \gset
\if :workgo_apply
BEGIN;
COMMIT;
\endif

-- DB-FINAL additive delta from DEV16; owner order.
SELECT :'workgo_service' = 'order' AS workgo_apply \gset
\if :workgo_apply
BEGIN;
create table if not exists provider_admissions (last_consumed_recovery_grant_id uuid, provider_id uuid not null, reservation_grant_id uuid, primary key (provider_id));
create table if not exists provider_restriction_projections (blocked boolean not null, source_version bigint not null, version bigint, provider_id uuid, id varchar(255) not null, source varchar(255), primary key (id));
create table if not exists reward_commit_outbox (acknowledged boolean not null, confirmed_at timestamp(6) with time zone not null, client_id uuid not null, order_id uuid not null, provider_id uuid not null, last_error varchar(255), quote_ref varchar(255) not null, primary key (order_id));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS recovery_grant_id uuid unique;
ALTER TABLE order_dispute_decisions ADD COLUMN IF NOT EXISTS actual_received_amount numeric(38,2);
ALTER TABLE order_dispute_decisions ADD COLUMN IF NOT EXISTS work_accepted boolean;
ALTER TABLE order_dispute_decisions ADD COLUMN IF NOT EXISTS payment_received boolean;
ALTER TABLE order_dispute_decisions ADD COLUMN IF NOT EXISTS cash_outcome_id uuid;
ALTER TABLE onsite_executions ADD COLUMN IF NOT EXISTS actual_received_amount numeric(38,2);
ALTER TABLE onsite_executions ADD COLUMN IF NOT EXISTS client_cash_paid_at timestamp(6) with time zone;
ALTER TABLE onsite_executions ADD COLUMN IF NOT EXISTS client_cash_paid_amount numeric(38,2);
COMMIT;
\endif

-- DB-FINAL additive delta from DEV16; owner payment.
SELECT :'workgo_service' = 'payment' AS workgo_apply \gset
\if :workgo_apply
BEGIN;
create table if not exists cash_decision_receipts (cash_return_due bigint not null, created_at timestamp(6) with time zone not null, fee_amount bigint not null, order_amount bigint not null, return_confirmed_at timestamp(6) with time zone, version bigint, client_id uuid not null, decision_id uuid not null, dispute_id uuid not null, fee_assessment_id uuid not null, fee_policy_version_id uuid not null, order_id uuid not null, provider_id uuid not null, return_confirmed_by uuid, payload_hash varchar(64) not null, currency varchar(255) not null, status varchar(255) not null, primary key (decision_id), unique (order_id));
create table if not exists verified_beneficiaries (expires_at timestamp(6) with time zone not null, verified_at timestamp(6) with time zone not null, id uuid not null, user_id uuid not null, account_name varchar(255) not null, account_number varchar(255) not null, bank_code varchar(255) not null, primary key (id));
ALTER TABLE financial_restrictions ADD COLUMN IF NOT EXISTS last_error varchar(200);
ALTER TABLE financial_restrictions ADD COLUMN IF NOT EXISTS job_synced_version bigint not null default 0;
ALTER TABLE wallet_payouts ADD COLUMN IF NOT EXISTS source_verified_at timestamp(6) with time zone;
ALTER TABLE wallet_payouts ADD COLUMN IF NOT EXISTS source_evidence_hash varchar(64);
ALTER TABLE wallet_payouts ADD COLUMN IF NOT EXISTS verified_beneficiary_id uuid;
ALTER TABLE wallet_payouts ADD COLUMN IF NOT EXISTS payload_hash varchar(64);
COMMIT;
\endif

-- DB-FINAL additive delta from DEV16; owner trust.
SELECT :'workgo_service' = 'trust' AS workgo_apply \gset
\if :workgo_apply
BEGIN;
create table if not exists reputation_projections (
        score integer not null,
        identity_synced_version bigint not null,
        job_synced_version bigint not null,
        source_version bigint not null,
        version bigint,
        provider_id uuid not null,
        last_error varchar(255),
        primary key (provider_id)
    );
create table if not exists reward_quotes (
        needs_review boolean not null,
        points integer not null,
        created_at timestamp(6) with time zone not null,
        expires_at timestamp(6) with time zone not null,
        client_id uuid not null,
        id uuid not null,
        provider_id uuid not null,
        input_hash varchar(64) not null,
        input_payload TEXT not null,
        model_version varchar(255) not null,
        rule_version varchar(255) not null,
        primary key (id)
    );
create table if not exists reward_reviews (
        approved_points integer,
        due_at timestamp(6) with time zone not null,
        requested_at timestamp(6) with time zone not null,
        reviewed_at timestamp(6) with time zone,
        version bigint,
        order_id uuid not null,
        reviewed_by uuid,
        reason varchar(1000),
        status varchar(255) not null,
        primary key (order_id)
    );
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS case_type varchar(255) not null default 'ESCROW';
COMMIT;
\endif



-- Canonical defaults and unique constraint: same shape for fresh and upgraded owners.
SELECT :'workgo_service' = 'payment' AS workgo_apply \gset
\if :workgo_apply
BEGIN;
ALTER TABLE financial_restrictions ALTER COLUMN job_synced_version SET DEFAULT 0;
DO $payout_unique$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='wallet_payouts'::regclass AND contype='u' AND conkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='wallet_payouts'::regclass AND attname='external_reference')]::smallint[]) THEN
  ALTER TABLE wallet_payouts ADD CONSTRAINT wallet_payouts_external_reference_key UNIQUE USING INDEX uq_wallet_payout_external_reference;
 END IF;
 IF to_regclass('uq_wallet_payout_external_reference') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conindid=to_regclass('uq_wallet_payout_external_reference')) THEN
  DROP INDEX uq_wallet_payout_external_reference;
 END IF;
END $payout_unique$;
COMMIT;
\endif
SELECT :'workgo_service' = 'trust' AS workgo_apply \gset
\if :workgo_apply
ALTER TABLE disputes ALTER COLUMN case_type SET DEFAULT 'ESCROW';
\endif

SELECT :'workgo_service' = 'trust' AS workgo_apply \gset
\if :workgo_apply
ALTER TABLE reputation_projections ADD COLUMN IF NOT EXISTS catalog_synced_version bigint NOT NULL DEFAULT 0;
ALTER TABLE reputation_projections ADD COLUMN IF NOT EXISTS order_synced_version bigint NOT NULL DEFAULT 0;
\endif
SELECT :'workgo_service' = 'trust' AS workgo_apply \gset
\if :workgo_apply
CREATE OR REPLACE VIEW rating AS
SELECT review_id AS id, order_id, service_id, reviewer_id, reviewee_id, direction,
       rating, comment, is_published, moderation_status, publish_eligible_at,
       published_at, created_at, updated_at, is_deleted, version
FROM reviews;
\endif
SELECT :'workgo_service' = 'order' AS workgo_apply \gset
\if :workgo_apply
BEGIN;
ALTER TABLE reward_commit_outbox ADD COLUMN IF NOT EXISTS event_key varchar(255);
UPDATE reward_commit_outbox SET event_key=order_id::text || ':' || quote_ref WHERE event_key IS NULL;
ALTER TABLE reward_commit_outbox ALTER COLUMN event_key SET NOT NULL;
DO $reward_key$ DECLARE old_key record; BEGIN
 FOR old_key IN SELECT conname FROM pg_constraint WHERE conrelid='reward_commit_outbox'::regclass AND contype='p' AND conkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='reward_commit_outbox'::regclass AND attname='order_id')]::smallint[] LOOP
  EXECUTE format('ALTER TABLE reward_commit_outbox DROP CONSTRAINT %I',old_key.conname);
  ALTER TABLE reward_commit_outbox ADD PRIMARY KEY(event_key);
 END LOOP;
END $reward_key$;
COMMIT;
\endif
SELECT :'workgo_service' = 'trust' AS workgo_apply \gset
\if :workgo_apply
CREATE TABLE IF NOT EXISTS reward_commit_receipts (
 event_key varchar(255) PRIMARY KEY,order_id uuid NOT NULL,quote_id uuid NOT NULL,provider_id uuid NOT NULL,client_id uuid NOT NULL,
 input_hash varchar(64) NOT NULL,confirmed_at timestamp(6) with time zone NOT NULL
);
\endif
SELECT :'workgo_service' = 'order' AS workgo_apply \gset
\if :workgo_apply
ALTER TABLE order_amendments ADD COLUMN IF NOT EXISTS reward_quote_ref varchar(255);
\endif
SELECT :'workgo_service' = 'job' AS workgo_apply \gset
\if :workgo_apply
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS reward_quote_ref varchar(255);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS accepted_at timestamp(6) with time zone;
\endif
SELECT pg_advisory_unlock(hashtext('workgo.schema:' || :'workgo_service'));
