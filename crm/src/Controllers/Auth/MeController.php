<?php
declare(strict_types=1);
namespace Controllers\Auth;

use Http\Request;
use Http\JsonResponse;
use Repositories\PersonRepository;
use Repositories\ContactMethodRepository;

class MeController
{
    public function handle(Request $request): void
    {
        if (!$request->isAuthenticated()) {
            JsonResponse::error('Authentication required', 401, 'UNAUTHENTICATED');
            exit;
        }

        $persons = new PersonRepository();
        $person  = $persons->findById($request->getCallerId());

        if ($person === null || !$person->active) {
            JsonResponse::error('User not found or inactive', 401, 'INVALID_SESSION');
            exit;
        }

        // Find primary email via ContactMethodRepository
        $cmRepo      = new ContactMethodRepository();
        $primaryCm   = $cmRepo->findPrimaryEmail($person->id);
        $primaryEmail = $primaryCm?->value;

        // Build CurrentUser shape per TechArch §4.2
        $department = null;
        if ($person->departmentId !== null) {
            $deptRepo   = new \Repositories\DepartmentRepository();
            $dept       = $deptRepo->findById($person->departmentId);
            $department = $dept ? ['id' => $dept->id, 'name' => $dept->name] : null;
        }

        JsonResponse::success([
            'id'           => $person->id,
            'firstName'    => $person->firstName,
            'lastName'     => $person->lastName,
            'role'         => $person->role,
            'department'   => $department,
            'primaryEmail' => $primaryEmail,
        ]);
    }
}
