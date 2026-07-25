import { CalendarClock } from "lucide-react";

export default function BookingsPlaceholder() {
  return (
    <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
      <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
        <CalendarClock className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="font-heading font-semibold text-coast-navy mb-1">
        Booking Analytics
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Booking analytics arrive with the PMS connection in September.
      </p>
    </div>
  );
}