<?php

namespace App\Events;

use App\Models\Company;
use App\Models\StockStatus;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StockStatusChanged
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $company;

    public $status;

    /**
     * Create a new event instance.
     */
    public function __construct(Company $company, StockStatus $status)
    {
        $this->company = $company;
        $this->status = $status;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('channel-name'),
        ];
    }
}
