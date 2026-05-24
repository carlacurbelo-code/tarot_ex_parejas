CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accessToken` varchar(64) NOT NULL,
	`clientName` varchar(200),
	`clientEmail` varchar(320),
	`situation` text NOT NULL,
	`selectedCards` text NOT NULL,
	`freeReading` text,
	`premiumQuestion` text,
	`paymentStatus` enum('pending','paid','refunded') NOT NULL DEFAULT 'pending',
	`paypalOrderId` varchar(100),
	`amountPaid` varchar(20),
	`currency` varchar(8) DEFAULT 'USD',
	`audioFileKey` varchar(500),
	`deliveryStatus` enum('pending','completed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`paidAt` timestamp,
	`completedAt` timestamp,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_accessToken_unique` UNIQUE(`accessToken`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `settings_key_unique` UNIQUE(`key`)
);
