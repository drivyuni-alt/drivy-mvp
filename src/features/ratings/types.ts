export interface SubmitRatingInput {
  tripId: string;
  bookingId: string;
  raterId: string;
  rateeId: string;
  punctuality: number;
  friendliness: number;
  /** Only set when rating a driver — null when a driver rates a passenger. */
  driving: number | null;
  communication: number;
  comment: string;
}
