import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CastMember {
  id: string;
  name: string;
  role: string;
  character: string;
  avatar: string;
}

export default function AboutSection() {
  //todo: remove mock functionality - Replace with actual cast data
  const castMembers: CastMember[] = [
    {
      id: "1",
      name: "Alex Rivera",
      role: "Game Master",
      character: "The Storyteller",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop",
    },
    {
      id: "2",
      name: "Jordan Chen",
      role: "Player",
      character: "Lyra Shadowmancer",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop",
    },
    {
      id: "3",
      name: "Sam Martinez",
      role: "Player",
      character: "Theron Ironheart",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop",
    },
    {
      id: "4",
      name: "Casey Williams",
      role: "Player",
      character: "Aria Moonwhisper",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop",
    },
  ];

  const stats = [
    { label: "Episodes", value: "50+" },
    { label: "Subscribers", value: "25K" },
    { label: "Watch Hours", value: "150K" },
  ];

  return (
    <section id="about" className="py-20 lg:py-32 bg-card">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-semibold mb-6" data-testid="text-about-title">
            About Tales of Aneria
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8" data-testid="text-about-description">
            Tales of Aneria is an epic tabletop RPG live play series that follows a group of unlikely heroes 
            as they navigate a world teetering on the edge of chaos. With rich storytelling, unforgettable characters, 
            and immersive world-building, each episode brings new adventures and unexpected twists.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-12 mb-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-primary mb-2" data-testid={`text-stat-value-${index}`}>
                  {stat.value}
                </div>
                <div className="text-muted-foreground" data-testid={`text-stat-label-${index}`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-serif text-3xl font-semibold mb-8 text-center" data-testid="text-cast-title">
            Meet the Cast
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {castMembers.map((member) => (
              <Card
                key={member.id}
                className="overflow-hidden hover-elevate cursor-pointer transition-all"
                data-testid={`card-cast-${member.id}`}
                onClick={() => console.log(`Cast member ${member.name} clicked`)}
              >
                <CardContent className="p-6 text-center">
                  <Avatar className="w-24 h-24 mx-auto mb-4">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <h4 className="font-semibold text-lg mb-1" data-testid={`text-cast-name-${member.id}`}>
                    {member.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2" data-testid={`text-cast-role-${member.id}`}>
                    {member.role}
                  </p>
                  <p className="text-sm text-primary font-medium" data-testid={`text-cast-character-${member.id}`}>
                    {member.character}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
