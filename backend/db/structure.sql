SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ar_internal_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ar_internal_metadata (
    key character varying NOT NULL,
    value character varying,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: employee_code_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_code_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id bigint NOT NULL,
    employee_code character varying DEFAULT ('EMP-'::text || lpad((nextval('public.employee_code_seq'::regclass))::text, 6, '0'::text)) NOT NULL,
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    full_name character varying GENERATED ALWAYS AS ((((first_name)::text || ' '::text) || (last_name)::text)) STORED,
    email character varying NOT NULL,
    job_title character varying NOT NULL,
    department character varying NOT NULL,
    country_code character varying(2) NOT NULL,
    currency character varying(3) NOT NULL,
    salary numeric(14,2) NOT NULL,
    employment_type character varying DEFAULT 'full_time'::character varying NOT NULL,
    hired_on date NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT employees_country_code_format CHECK (((country_code)::text ~ '^[A-Z]{2}$'::text)),
    CONSTRAINT employees_currency_format CHECK (((currency)::text ~ '^[A-Z]{3}$'::text)),
    CONSTRAINT employees_email_length CHECK ((char_length((email)::text) <= 255)),
    CONSTRAINT employees_employment_type_check CHECK (((employment_type)::text = ANY ((ARRAY['full_time'::character varying, 'part_time'::character varying, 'contractor'::character varying])::text[]))),
    CONSTRAINT employees_first_name_length CHECK (((char_length((first_name)::text) >= 1) AND (char_length((first_name)::text) <= 50))),
    CONSTRAINT employees_job_title_length CHECK (((char_length((job_title)::text) >= 2) AND (char_length((job_title)::text) <= 100))),
    CONSTRAINT employees_last_name_length CHECK (((char_length((last_name)::text) >= 1) AND (char_length((last_name)::text) <= 50))),
    CONSTRAINT employees_salary_range CHECK (((salary > (0)::numeric) AND (salary <= (100000000)::numeric)))
);


--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employees_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: jwt_denylists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jwt_denylists (
    id bigint NOT NULL,
    jti character varying NOT NULL,
    exp timestamp(6) without time zone NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: jwt_denylists_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.jwt_denylists_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jwt_denylists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.jwt_denylists_id_seq OWNED BY public.jwt_denylists.id;


--
-- Name: salary_revisions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salary_revisions (
    id bigint NOT NULL,
    employee_id bigint NOT NULL,
    changed_by_id bigint NOT NULL,
    amount numeric(14,2) NOT NULL,
    previous_amount numeric(14,2),
    currency character varying(3) NOT NULL,
    effective_on date NOT NULL,
    reason character varying NOT NULL,
    note text,
    created_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT salary_revisions_amount_range CHECK (((amount > (0)::numeric) AND (amount <= (100000000)::numeric))),
    CONSTRAINT salary_revisions_note_length CHECK (((note IS NULL) OR (char_length(note) <= 500))),
    CONSTRAINT salary_revisions_previous_amount_positive CHECK (((previous_amount IS NULL) OR (previous_amount > (0)::numeric))),
    CONSTRAINT salary_revisions_reason_check CHECK (((reason)::text = ANY ((ARRAY['hire'::character varying, 'promotion'::character varying, 'annual_review'::character varying, 'market_adjustment'::character varying, 'correction'::character varying, 'other'::character varying])::text[])))
);


--
-- Name: salary_revisions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.salary_revisions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: salary_revisions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.salary_revisions_id_seq OWNED BY public.salary_revisions.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    email character varying NOT NULL,
    encrypted_password character varying NOT NULL,
    name character varying NOT NULL,
    role character varying DEFAULT 'viewer'::character varying NOT NULL,
    sign_in_count integer DEFAULT 0 NOT NULL,
    current_sign_in_at timestamp(6) without time zone,
    last_sign_in_at timestamp(6) without time zone,
    current_sign_in_ip character varying,
    last_sign_in_ip character varying,
    failed_attempts integer DEFAULT 0 NOT NULL,
    locked_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['hr_manager'::character varying, 'viewer'::character varying])::text[])))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: jwt_denylists id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jwt_denylists ALTER COLUMN id SET DEFAULT nextval('public.jwt_denylists_id_seq'::regclass);


--
-- Name: salary_revisions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_revisions ALTER COLUMN id SET DEFAULT nextval('public.salary_revisions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: ar_internal_metadata ar_internal_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_internal_metadata
    ADD CONSTRAINT ar_internal_metadata_pkey PRIMARY KEY (key);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: jwt_denylists jwt_denylists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jwt_denylists
    ADD CONSTRAINT jwt_denylists_pkey PRIMARY KEY (id);


--
-- Name: salary_revisions salary_revisions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_revisions
    ADD CONSTRAINT salary_revisions_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: index_employees_on_country_code_and_job_title; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_employees_on_country_code_and_job_title ON public.employees USING btree (country_code, job_title);


--
-- Name: index_employees_on_department; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_employees_on_department ON public.employees USING btree (department);


--
-- Name: index_employees_on_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_employees_on_email ON public.employees USING btree (email);


--
-- Name: index_employees_on_email_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_employees_on_email_trgm ON public.employees USING gin (email public.gin_trgm_ops);


--
-- Name: index_employees_on_employee_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_employees_on_employee_code ON public.employees USING btree (employee_code);


--
-- Name: index_employees_on_full_name_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_employees_on_full_name_trgm ON public.employees USING gin (full_name public.gin_trgm_ops);


--
-- Name: index_employees_on_hired_on; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_employees_on_hired_on ON public.employees USING btree (hired_on);


--
-- Name: index_employees_on_salary; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_employees_on_salary ON public.employees USING btree (salary);


--
-- Name: index_jwt_denylists_on_jti; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_jwt_denylists_on_jti ON public.jwt_denylists USING btree (jti);


--
-- Name: index_salary_revisions_on_changed_by_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_salary_revisions_on_changed_by_id ON public.salary_revisions USING btree (changed_by_id);


--
-- Name: index_salary_revisions_on_effective_on; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_salary_revisions_on_effective_on ON public.salary_revisions USING btree (effective_on);


--
-- Name: index_salary_revisions_on_employee_latest; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_salary_revisions_on_employee_latest ON public.salary_revisions USING btree (employee_id, effective_on DESC, id DESC);


--
-- Name: index_users_on_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_users_on_email ON public.users USING btree (email);


--
-- Name: salary_revisions fk_rails_9251153654; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_revisions
    ADD CONSTRAINT fk_rails_9251153654 FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: salary_revisions fk_rails_eb1482f261; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_revisions
    ADD CONSTRAINT fk_rails_eb1482f261 FOREIGN KEY (changed_by_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

SET search_path TO "$user", public;

INSERT INTO "schema_migrations" (version) VALUES
('20261030120000'),
('20261030110000'),
('20261030100100'),
('20261030100000');

