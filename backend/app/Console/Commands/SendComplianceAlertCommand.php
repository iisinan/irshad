<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ComplianceReview;
use App\Models\Company;
use Illuminate\Support\Facades\Mail;

class SendComplianceAlertCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'compliance:alert {company_id}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send an admin alert email when a company changes compliance verdict.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $companyId = $this->argument('company_id');
        $company = Company::find($companyId);
        
        if (!$company) {
            $this->error("Company not found.");
            return;
        }

        $review = ComplianceReview::where('company_id', $companyId)
                                  ->where('status', 'pending')
                                  ->orderBy('created_at', 'desc')
                                  ->first();

        if (!$review) {
            $this->error("No pending review found for this company.");
            return;
        }

        $adminEmail = 'sinanismailaidris@gmail.com';
        $subject = "Irshad Alert: Compliance Verdict Change for {$company->symbol}";
        
        $body = "Admin,\n\n"
              . "The automated pipeline detected a verdict change for {$company->name} ({$company->symbol}).\n\n"
              . "Old Status: {$review->old_status}\n"
              . "New Status: {$review->new_status}\n"
              . "Reason: {$review->reason}\n\n"
              . "The latest financial extraction has been blocked from updating the database until you review it.\n\n"
              . "Please log in to the admin portal to approve or reject this change.\n";

        try {
            Mail::raw($body, function ($message) use ($adminEmail, $subject) {
                $message->to($adminEmail)->subject($subject);
            });
            $this->info("Alert email sent successfully to $adminEmail");
        } catch (\Exception $e) {
            $this->error("Failed to send email: " . $e->getMessage());
        }
    }
}
