import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function QuickLinks() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-2">
      <Link to="/cases/new">
        <Button className="w-full">New Case</Button>
      </Link>
      <Link to="/cases?status=open">
        <Button variant="outline" className="w-full">All Open Cases</Button>
      </Link>
      <Link to={`/cases?status=open&assignedPerson_id=${user?.personId ?? ''}`}>
        <Button variant="outline" className="w-full">Assigned to Me</Button>
      </Link>
    </div>
  );
}

export default QuickLinks;
