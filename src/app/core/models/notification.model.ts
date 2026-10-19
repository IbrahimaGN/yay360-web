export interface NotificationDto {
  id: number;
  type: string;
  titre: string;
  message: string;
  lue: boolean;
  dateEnvoi: string;
  dateLecture: string | null;
}
