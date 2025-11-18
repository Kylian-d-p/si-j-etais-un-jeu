import { createSafeActionClient } from "next-safe-action";

export const createSafeAction = createSafeActionClient({
  handleServerError: (e) => {
    return { message: e.message, success: false };
  },
});
