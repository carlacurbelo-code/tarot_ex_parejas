CREATE TABLE `tarotCreditPacks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`packToken` varchar(80) NOT NULL,
	`profileId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`dodoProductId` varchar(100) NOT NULL,
	`dodoBrandId` varchar(100) NOT NULL,
	`checkoutSessionId` varchar(120),
	`dodoPaymentId` varchar(120),
	`status` enum('checkout_created','paid') NOT NULL DEFAULT 'checkout_created',
	`creditsGranted` int NOT NULL DEFAULT 3,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`paidAt` timestamp,
	CONSTRAINT `tarotCreditPacks_id` PRIMARY KEY(`id`),
	CONSTRAINT `tarotCreditPacks_packToken_unique` UNIQUE(`packToken`),
	CONSTRAINT `tarotCreditPacks_checkoutSessionId_unique` UNIQUE(`checkoutSessionId`),
	CONSTRAINT `tarotCreditPacks_dodoPaymentId_unique` UNIQUE(`dodoPaymentId`)
);
--> statement-breakpoint
CREATE TABLE `tarotProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`marketingConsent` tinyint NOT NULL DEFAULT 0,
	`credits` int NOT NULL DEFAULT 0,
	`freeReadingClaimedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tarotProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `tarotProfiles_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `tarotReadings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`readingToken` varchar(80) NOT NULL,
	`profileId` int,
	`question` text NOT NULL,
	`context` enum('love','money_work') NOT NULL,
	`selectedCards` text NOT NULL,
	`interpretation` text,
	`kind` enum('free','credit') NOT NULL,
	`status` enum('pending_email','ready','consumed') NOT NULL DEFAULT 'pending_email',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tarotReadings_id` PRIMARY KEY(`id`),
	CONSTRAINT `tarotReadings_readingToken_unique` UNIQUE(`readingToken`)
);
