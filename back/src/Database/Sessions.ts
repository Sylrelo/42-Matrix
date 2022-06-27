export default interface Sessions {
    uid: string;
    student_id: number;
    created_at: number;
    last_access: number;
    ip_hash?: string;
}
