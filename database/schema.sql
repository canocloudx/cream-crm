--
-- PostgreSQL database dump
--

\restrict A4tDMAWTRQ2DhckVpfnJyPzzfybSOac3xXm1tauAeyLavHPsvLjr104uXZiv3OI

-- Dumped from database version 16.11 (Homebrew)
-- Dumped by pg_dump version 16.11 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: canocloudx
--

CREATE TABLE public.campaigns (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    campaign_type character varying(50),
    start_date date,
    end_date date,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.campaigns OWNER TO canocloudx;

--
-- Name: campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: canocloudx
--

CREATE SEQUENCE public.campaigns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.campaigns_id_seq OWNER TO canocloudx;

--
-- Name: campaigns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: canocloudx
--

ALTER SEQUENCE public.campaigns_id_seq OWNED BY public.campaigns.id;


--
-- Name: members; Type: TABLE; Schema: public; Owner: canocloudx
--

CREATE TABLE public.members (
    id integer NOT NULL,
    member_id character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    birthday date,
    gender character varying(20),
    stamps integer DEFAULT 0,
    total_rewards integer DEFAULT 0,
    available_rewards integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.members OWNER TO canocloudx;

--
-- Name: members_id_seq; Type: SEQUENCE; Schema: public; Owner: canocloudx
--

CREATE SEQUENCE public.members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.members_id_seq OWNER TO canocloudx;

--
-- Name: members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: canocloudx
--

ALTER SEQUENCE public.members_id_seq OWNED BY public.members.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: canocloudx
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    member_id integer,
    title character varying(200),
    body text,
    sent_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.messages OWNER TO canocloudx;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: canocloudx
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO canocloudx;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: canocloudx
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: reward_history; Type: TABLE; Schema: public; Owner: canocloudx
--

CREATE TABLE public.reward_history (
    id integer NOT NULL,
    member_id integer,
    type character varying(20) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.reward_history OWNER TO canocloudx;

--
-- Name: reward_history_id_seq; Type: SEQUENCE; Schema: public; Owner: canocloudx
--

CREATE SEQUENCE public.reward_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reward_history_id_seq OWNER TO canocloudx;

--
-- Name: reward_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: canocloudx
--

ALTER SEQUENCE public.reward_history_id_seq OWNED BY public.reward_history.id;


--
-- Name: campaigns id; Type: DEFAULT; Schema: public; Owner: canocloudx
--

ALTER TABLE ONLY public.campaigns ALTER COLUMN id SET DEFAULT nextval('public.campaigns_id_seq'::regclass);


--
-- Name: members id; Type: DEFAULT; Schema: public; Owner: canocloudx
--

ALTER TABLE ONLY public.members ALTER COLUMN id SET DEFAULT nextval('public.members_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: canocloudx
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: reward_history id; Type: DEFAULT; Schema: public; Owner: canocloudx
--

ALTER TABLE ONLY public.reward_history ALTER COLUMN id SET DEFAULT nextval('public.reward_history_id_seq'::regclass);


--
-- Data for Name: campaigns; Type: TABLE DATA; Schema: public; Owner: canocloudx
--

COPY public.campaigns (id, name, description, campaign_type, start_date, end_date, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: members; Type: TABLE DATA; Schema: public; Owner: canocloudx
--

COPY public.members (id, member_id, name, email, phone, birthday, gender, stamps, total_rewards, available_rewards, created_at, updated_at) FROM stdin;
1	CREAM-123456	Sarah Chen	sarah@email.com	\N	\N	\N	4	5	2	2025-12-18 16:03:47.993474	2025-12-18 16:03:47.993474
2	CREAM-234567	Mike Johnson	mike@email.com	\N	\N	\N	2	3	1	2025-12-18 16:03:47.993474	2025-12-18 16:03:47.993474
3	CREAM-345678	Emily Davis	emily@email.com	\N	\N	\N	5	8	0	2025-12-18 16:03:47.993474	2025-12-18 16:03:47.993474
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: canocloudx
--

COPY public.messages (id, member_id, title, body, sent_at) FROM stdin;
\.


--
-- Data for Name: reward_history; Type: TABLE DATA; Schema: public; Owner: canocloudx
--

COPY public.reward_history (id, member_id, type, description, created_at) FROM stdin;
\.


--
-- Name: campaigns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: canocloudx
--

SELECT pg_catalog.setval('public.campaigns_id_seq', 1, false);


--
-- Name: members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: canocloudx
--

SELECT pg_catalog.setval('public.members_id_seq', 3, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: canocloudx
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, false);


--
-- Name: reward_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: canocloudx
--

SELECT pg_catalog.setval('public.reward_history_id_seq', 1, false);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: canocloudx
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: members members_email_key; Type: CONSTRAINT; Schema: public; Owner: canocloudx
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_email_key UNIQUE (email);


--
-- Name: members members_member_id_key; Type: CONSTRAINT; Schema: public; Owner: canocloudx
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_member_id_key UNIQUE (member_id);


--
-- Name: members members_pkey; Type: CONSTRAINT; Schema: public; Owner: canocloudx
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: canocloudx
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: reward_history reward_history_pkey; Type: CONSTRAINT; Schema: public; Owner: canocloudx
--

ALTER TABLE ONLY public.reward_history
    ADD CONSTRAINT reward_history_pkey PRIMARY KEY (id);


--
-- Name: idx_members_email; Type: INDEX; Schema: public; Owner: canocloudx
--

CREATE INDEX idx_members_email ON public.members USING btree (email);


--
-- Name: idx_members_member_id; Type: INDEX; Schema: public; Owner: canocloudx
--

CREATE INDEX idx_members_member_id ON public.members USING btree (member_id);


--
-- Name: idx_reward_history_member; Type: INDEX; Schema: public; Owner: canocloudx
--

CREATE INDEX idx_reward_history_member ON public.reward_history USING btree (member_id);


--
-- Name: messages messages_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: canocloudx
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: reward_history reward_history_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: canocloudx
--

ALTER TABLE ONLY public.reward_history
    ADD CONSTRAINT reward_history_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO cream_admin;


--
-- Name: TABLE campaigns; Type: ACL; Schema: public; Owner: canocloudx
--

GRANT ALL ON TABLE public.campaigns TO cream_admin;


--
-- Name: SEQUENCE campaigns_id_seq; Type: ACL; Schema: public; Owner: canocloudx
--

GRANT SELECT,USAGE ON SEQUENCE public.campaigns_id_seq TO cream_admin;


--
-- Name: TABLE members; Type: ACL; Schema: public; Owner: canocloudx
--

GRANT ALL ON TABLE public.members TO cream_admin;


--
-- Name: SEQUENCE members_id_seq; Type: ACL; Schema: public; Owner: canocloudx
--

GRANT SELECT,USAGE ON SEQUENCE public.members_id_seq TO cream_admin;


--
-- Name: TABLE messages; Type: ACL; Schema: public; Owner: canocloudx
--

GRANT ALL ON TABLE public.messages TO cream_admin;


--
-- Name: SEQUENCE messages_id_seq; Type: ACL; Schema: public; Owner: canocloudx
--

GRANT SELECT,USAGE ON SEQUENCE public.messages_id_seq TO cream_admin;


--
-- Name: TABLE reward_history; Type: ACL; Schema: public; Owner: canocloudx
--

GRANT ALL ON TABLE public.reward_history TO cream_admin;


--
-- Name: SEQUENCE reward_history_id_seq; Type: ACL; Schema: public; Owner: canocloudx
--

GRANT SELECT,USAGE ON SEQUENCE public.reward_history_id_seq TO cream_admin;


--
-- PostgreSQL database dump complete
--

\unrestrict A4tDMAWTRQ2DhckVpfnJyPzzfybSOac3xXm1tauAeyLavHPsvLjr104uXZiv3OI

