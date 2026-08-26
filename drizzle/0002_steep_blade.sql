CREATE TABLE `dodoDeepReadingPurchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`purchaseToken` varchar(64) NOT NULL,
	`question` text NOT NULL,
	`context` enum('love','money_work') NOT NULL,
	`action` enum('deepen','new_question') NOT NULL,
	`status` enum('checkout_created','paid','generating','consumed') NOT NULL DEFAULT 'checkout_created',
	`dodoProductId` varchar(100) NOT NULL,
	`checkoutSessionId` varchar(120),
	`dodoPaymentId` varchar(120),
	`generationAttempts` int NOT NULL DEFAULT 0,
	`lastGenerationError` text,
	`paidAt` timestamp,
	`consumedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dodoDeepReadingPurchases_id` PRIMARY KEY(`id`),
	CONSTRAINT `dodoDeepReadingPurchases_purchaseToken_unique` UNIQUE(`purchaseToken`),
	CONSTRAINT `dodoDeepReadingPurchases_checkoutSessionId_unique` UNIQUE(`checkoutSessionId`),
	CONSTRAINT `dodoDeepReadingPurchases_dodoPaymentId_unique` UNIQUE(`dodoPaymentId`)
);
--> statement-breakpoint
CREATE TABLE `dodoWebhookEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`webhookEventId` varchar(160) NOT NULL,
	`eventType` varchar(120) NOT NULL,
	`dodoPaymentId` varchar(120),
	`purchaseToken` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dodoWebhookEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `dodoWebhookEvents_webhookEventId_unique` UNIQUE(`webhookEventId`)
);
