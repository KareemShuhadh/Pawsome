import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Tag } from "lucide-react";

// TODO: Connect to a "deals" table in Supabase later
// For now, this is a visual placeholder showing how sponsored deals will look

const dummyDeals = [
  {
    id: "d1",
    shop_name: "Pawfect Treats",
    offer: "20% off organic dog biscuits",
    code: "PAWSOME20",
    link: "#",
    color: "bg-orange-100 text-orange-700",
  },
  {
    id: "d2",
    shop_name: "Bark & Style",
    offer: "Free collar engraving",
    code: "BARKFREE",
    link: "#",
    color: "bg-teal-100 text-teal-700",
  },
  {
    id: "d3",
    shop_name: "Doggo Gear",
    offer: "Buy 1 leash, get 1 toy free",
    code: "DOUBLEDOG",
    link: "#",
    color: "bg-amber-100 text-amber-700",
  },
];

export const DealsBar = () => {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-warm flex items-center justify-center text-white text-lg shadow-glow">
          <Tag className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold leading-tight">Community Deals</h2>
          <p className="text-sm text-muted-foreground">Exclusive offers for Pawsome members</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dummyDeals.map((deal) => (
          <Card
            key={deal.id}
            className="p-5 border-2 border-border/60 shadow-soft hover:shadow-card hover:-translate-y-1 transition-bounce cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-lg">{deal.shop_name}</h3>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-smooth" />
            </div>
            <p className="text-sm text-foreground/80 mb-3">{deal.offer}</p>
            <Badge className={`${deal.color} font-bold`}>
              Code: {deal.code}
            </Badge>
          </Card>
        ))}
      </div>
    </div>
  );
};