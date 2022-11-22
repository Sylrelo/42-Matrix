export interface IStudent {
    _id?: Id;
    id?: number;
    campus_id?: number;
    correction_points?: number;
    display_name?: string;
    image_url?: string;
    last_seen?: number;
    level?: number;
    login?: string;
    new_image_url?: string;
    image?: Record<string, any>;
    pool_year?: string;
    wallets?: number;
    test?: string;
    achievements?: Achievement[];
    "alumni?"?: boolean;
    alumnized_at?: any;
    anonymize_date?: string;
    campus?: Campu[];
    campus_users?: CampusUser[];
    correction_point?: number;
    created_at?: string;
    cursus_users?: CursusUser[];
    data_erasure_date?: string;
    displayname?: string;
    email?: string;
    expertises_users?: any[];
    first_name?: string;
    groups?: Group[];
    languages_users?: LanguagesUser[];
    last_name?: string;
    location?: string;
    partnerships?: any[];
    patroned?: any[];
    patroning?: any[];
    phone?: string;
    pool_month?: string;
    projects_users?: ProjectsUser[];
    roles?: any[];
    "staff?"?: boolean;
    titles?: Title[];
    titles_users?: TitlesUser[];
    updated_at?: string;
    url?: string;
    usual_first_name?: any;
    usual_full_name?: string;
    wallet?: number;
    coalition?: any;
}

export interface Id {
    $oid: string;
}

export interface Achievement {
    id: number;
    name: string;
    description: string;
    tier: string;
    kind: string;
    visible: boolean;
    image: string;
    nbr_of_success?: number;
    users_url: string;
}

export interface Campu {
    id: number;
    name: string;
    time_zone: string;
    language: Language;
    users_count: number;
    vogsphere_id: number;
    country: string;
    address: string;
    zip: string;
    city: string;
    website: string;
    facebook: string;
    twitter: string;
    active: boolean;
    public: boolean;
    email_extension: string;
    default_hidden_phone: boolean;
}

export interface Language {
    id: number;
    name: string;
    identifier: string;
    created_at: string;
    updated_at: string;
}

export interface CampusUser {
    id: number;
    user_id: number;
    campus_id: number;
    is_primary: boolean;
    created_at: string;
    updated_at: string;
}

export interface CursusUser {
    grade?: string;
    level: number;
    skills: Skill[];
    blackholed_at?: string;
    id: number;
    begin_at: string;
    end_at?: string;
    cursus_id: number;
    has_coalition: boolean;
    created_at: string;
    updated_at: string;
    user: User;
    cursus: Cursus;
}

export interface Skill {
    id: number;
    name: string;
    level: number;
}

export interface User {
    id: number;
    email: string;
    login: string;
    first_name: string;
    last_name: string;
    usual_full_name: string;
    usual_first_name: any;
    url: string;
    phone: string;
    displayname: string;
    image_url: string;
    new_image_url: string;
    "staff?": boolean;
    correction_point: number;
    pool_month: string;
    pool_year: string;
    location: string;
    wallet: number;
    anonymize_date: string;
    data_erasure_date: string;
    created_at: string;
    updated_at: string;
    alumnized_at: any;
    "alumni?": boolean;
}

export interface Cursus {
    id: number;
    created_at: string;
    name: string;
    slug: string;
}

export interface Group {
    id: number;
    name: string;
}

export interface LanguagesUser {
    id: number;
    language_id: number;
    user_id: number;
    position: number;
    created_at: string;
}

export interface ProjectsUser {
    id: number;
    occurrence: number;
    final_mark?: number;
    status: string;
    "validated?"?: boolean;
    current_team_id: number;
    project: Project;
    cursus_ids: number[];
    marked_at?: string;
    marked: boolean;
    retriable_at?: string;
    created_at: string;
    updated_at: string;
}

export interface Project {
    id: number;
    name: string;
    slug: string;
    parent_id: any;
}

export interface Title {
    id: number;
    name: string;
}

export interface TitlesUser {
    id: number;
    user_id: number;
    title_id: number;
    selected: boolean;
    created_at: string;
    updated_at: string;
}
