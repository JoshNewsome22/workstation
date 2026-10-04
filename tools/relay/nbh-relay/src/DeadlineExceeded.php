<?php

declare(strict_types=1);

namespace NBH\Relay;

/** No time was left for (another) attempt at the Anthropic API. Not a PSR-18 exception, so the SDK does not retry it. */
final class DeadlineExceeded extends \RuntimeException
{
}
