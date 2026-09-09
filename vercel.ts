export const config = {
  crons: [
    {
      path: "/api/cron/reminders",
      // Vercel execute les crons en UTC. 07:00 UTC garde le rappel dans la
      // matinee de travail a Paris : 09:00 en hiver, 08:00 en ete.
      schedule: "0 7 * * *",
    },
  ],
};
