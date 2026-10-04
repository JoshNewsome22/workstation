<?php

declare(strict_types=1);

namespace NBH\Relay;

use GuzzleHttp\ClientInterface as GuzzleClient;
use GuzzleHttp\Exception\ConnectException;
use Psr\Http\Client\ClientInterface;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;

/**
 * The HTTP transport handed to the Anthropic SDK (its `transporter` request option; the SDK's own `timeout`
 * option is advisory and enforced by the transport). One deadline covers the whole call, the SDK's retry
 * included, so the relay always answers the forms' panel before the panel stops waiting (60 seconds):
 *
 *  - each attempt gets the time that is left as its timeout;
 *  - with less than a second left no attempt is made (DeadlineExceeded, which the SDK does not retry);
 *  - a 408/409/429/5xx answer is marked "x-should-retry: false" (a header the SDK obeys) when the wait it asks
 *    for plus a fair try would not fit in the time left, so no retry is paid for that nobody would see.
 *
 * It sends requests exactly as Guzzle's own PSR-18 sendRequest() does (no redirects, no exceptions for HTTP
 * errors), plus the timeouts.
 */
final class DeadlineTransport implements ClientInterface
{
    /** a retry is made only if at least this many seconds remain after its wait */
    public const MIN_RETRY_SECONDS = 20.0;

    public bool $timedOut = false;

    public int $attempts = 0;

    public function __construct(
        private GuzzleClient $guzzle,
        private float $deadline,
        private float $connectTimeout = 10.0,
    ) {
    }

    public function sendRequest(RequestInterface $request): ResponseInterface
    {
        $left = $this->deadline - microtime(true);
        if ($left < 1.0) {
            $this->timedOut = true;
            throw new DeadlineExceeded('The time for this rewrite ran out before another attempt could be made.');
        }
        $this->attempts++;
        try {
            $response = $this->guzzle->send($request, [
                'synchronous' => true,
                'allow_redirects' => false,
                'http_errors' => false,
                'timeout' => $left,
                'connect_timeout' => min($this->connectTimeout, $left),
            ]);
        } catch (ConnectException $e) {
            if ((int) ($e->getHandlerContext()['errno'] ?? 0) === 28) {   // CURLE_OPERATION_TIMEDOUT
                $this->timedOut = true;
            }
            throw $e;
        }

        $status = $response->getStatusCode();
        if ($status === 408 || $status === 409 || $status === 429 || $status >= 500) {
            $after = $this->deadline - microtime(true) - max(self::retryAfter($response), 0.5);
            if ($after < min(self::MIN_RETRY_SECONDS, ($this->deadline - microtime(true)) / 2)) {
                $response = $response->withHeader('x-should-retry', 'false');
            }
        }
        return $response;
    }

    /** The wait an answer asks for, in seconds (retry-after-ms, or retry-after as seconds or a date). */
    public static function retryAfter(ResponseInterface $r): float
    {
        $ms = $r->getHeaderLine('retry-after-ms');
        if (is_numeric($ms)) {
            return max(0.0, (float) $ms / 1000);
        }
        $s = trim($r->getHeaderLine('retry-after'));
        if ($s === '') {
            return 0.0;
        }
        if (is_numeric($s)) {
            return max(0.0, (float) $s);
        }
        $t = strtotime($s);
        return $t === false ? 0.0 : max(0.0, (float) ($t - time()));
    }
}
