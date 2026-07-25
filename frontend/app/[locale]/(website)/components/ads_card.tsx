import {
    Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from '@/shared/components/common';

export default function ADsCard() {
  return (
    <Card
      className="relative flex min-h-[280px] flex-col justify-end overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/car.svg')" }}
    >
      <CardContent>
        <CardTitle className="text-2xl font-semibold text-primary-foreground">
          2019 Mercedes-Benz AMG GT-R
        </CardTitle>
        <CardDescription className="text-primary-foreground">
          Starting bid: ₦35M
        </CardDescription>
      </CardContent>
      <CardFooter>
        <Button variant="default" size="xl">
          Bid Now
        </Button>
      </CardFooter>
    </Card>
  );
}
