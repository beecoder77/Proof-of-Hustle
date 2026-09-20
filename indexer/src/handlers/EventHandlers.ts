import {
  GigEscrow,
  ProofOfHustleSBT,
  ProtocolBurnPool,
  BigDecimal,
} from "generated";

// Event Handlers for GigEscrow
GigEscrow.GigCreated.handler(async ({ event, context }) => {
  context.Gig.set({
    id: event.params.gigId.toString(),
    creator: event.params.creator.toLowerCase(),
    token: event.params.token.toLowerCase(),
    rewardAmount: event.params.rewardAmount,
    gigType: Number(event.params.gigType),
    status: 1, // OPEN
    isSealed: event.params.isSealed,
    deadline: BigInt(event.params.deadline),
    totalHypeStaked: 0n,
    hustler: undefined,
    createdAt: BigInt(event.block.timestamp),
    submittedAt: undefined,
    submissionsCount: 0,
    finalRating: undefined,
    metadataCid: event.params.metadataCid,
  });
});

GigEscrow.TaskClaimed.handler(async ({ event, context }) => {
  const gig = await context.Gig.get(event.params.gigId.toString());
  if (gig) {
    context.Gig.set({
      ...gig,
      status: 2, // IN_PROGRESS
      hustler: event.params.hustler.toLowerCase(),
    });
  }
});

GigEscrow.WorkSubmitted.handler(async ({ event, context }) => {
  const gigId = event.params.gigId.toString();
  const submissionId = `${gigId}-${event.params.submissionId}`;

  context.Submission.set({
    id: submissionId,
    gig_id: gigId,
    hustler: event.params.hustler.toLowerCase(),
    submittedAt: BigInt(event.block.timestamp),
    isSealed: event.params.isSealed,
    deliverableUri: "",
    commitHash: undefined,
  });

  const gig = await context.Gig.get(gigId);
  if (gig) {
    context.Gig.set({
      ...gig,
      status: 3, // IN_REVIEW
      submittedAt: BigInt(event.block.timestamp),
      submissionsCount: gig.submissionsCount + 1,
    });
  }
});

GigEscrow.PayoutReleased.handler(async ({ event, context }) => {
  const gigId = event.params.gigId.toString();
  const worker = event.params.hustler.toLowerCase();

  const gig = await context.Gig.get(gigId);
  if (gig) {
    context.Gig.set({
      ...gig,
      status: 4, // SETTLED
      finalRating: Number(event.params.rating),
    });
  }

  // Update or initialize Hustler Profile
  const profile = await context.HustlerProfile.get(worker);
  if (profile) {
    const newCompleted = profile.completedGigs + 1;
    const newEarned = profile.totalEarned + event.params.payoutAmount;
    let newTier = profile.currentTier;
    if (newCompleted >= 25) newTier = 4; // GigaHustler
    else if (newCompleted >= 10) newTier = 3; // Master
    else if (newCompleted >= 3) newTier = 2; // Craftsman

    const newAvg = profile.averageRating
      .multipliedBy(profile.completedGigs)
      .plus(Number(event.params.rating))
      .dividedBy(newCompleted);

    context.HustlerProfile.set({
      ...profile,
      totalEarned: newEarned,
      completedGigs: newCompleted,
      averageRating: newAvg,
      currentTier: newTier,
      lastActiveTimestamp: BigInt(event.block.timestamp),
    });
  } else {
    context.HustlerProfile.set({
      id: worker,
      totalEarned: event.params.payoutAmount,
      completedGigs: 1,
      averageRating: new BigDecimal(event.params.rating.toString()),
      currentTier: 1, // Apprentice
      lastActiveTimestamp: BigInt(event.block.timestamp),
    });
  }
});

GigEscrow.PayoutAutoReleased.handler(async ({ event, context }) => {
  const gigId = event.params.gigId.toString();
  const worker = event.params.hustler.toLowerCase();

  const gig = await context.Gig.get(gigId);
  if (gig) {
    context.Gig.set({
      ...gig,
      status: 4, // SETTLED
      finalRating: 5,
    });
  }

  const profile = await context.HustlerProfile.get(worker);
  if (profile) {
    const newCompleted = profile.completedGigs + 1;
    const newAvg = profile.averageRating
      .multipliedBy(profile.completedGigs)
      .plus(5)
      .dividedBy(newCompleted);

    context.HustlerProfile.set({
      ...profile,
      totalEarned: profile.totalEarned + event.params.payoutAmount,
      completedGigs: newCompleted,
      averageRating: newAvg,
      lastActiveTimestamp: BigInt(event.block.timestamp),
    });
  }
});

GigEscrow.HypeStaked.handler(async ({ event, context }) => {
  const gigId = event.params.gigId.toString();
  const eventId = `${gigId}-${event.params.curator}-${event.block.timestamp}`;

  context.HypeEvent.set({
    id: eventId,
    gig_id: gigId,
    curator: event.params.curator.toLowerCase(),
    amount: event.params.amount,
    totalHype: event.params.totalHype,
    timestamp: BigInt(event.block.timestamp),
    txHash: event.transaction.hash,
  });

  const gig = await context.Gig.get(gigId);
  if (gig) {
    context.Gig.set({
      ...gig,
      totalHypeStaked: event.params.totalHype,
    });
  }
});

GigEscrow.EarlyCuratorRegistered.handler(async ({ event, context }) => {
  const gigId = event.params.gigId.toString();
  const recordId = `${gigId}-${event.params.curator}`;

  context.EarlyCurator.set({
    id: recordId,
    gig_id: gigId,
    curator: event.params.curator.toLowerCase(),
    rank: event.params.rank,
  });
});

GigEscrow.DisputeRaised.handler(async ({ event, context }) => {
  const gig = await context.Gig.get(event.params.gigId.toString());
  if (gig) {
    context.Gig.set({
      ...gig,
      status: 5, // DISPUTED
    });
  }
});

GigEscrow.DisputeResolved.handler(async ({ event, context }) => {
  const gig = await context.Gig.get(event.params.gigId.toString());
  if (gig) {
    context.Gig.set({
      ...gig,
      status: 4, // SETTLED / RESOLVED
    });
  }
});

// Event Handlers for ProofOfHustleSBT
ProofOfHustleSBT.ProofMinted.handler(async ({ event, context }) => {
  context.ProofCredential.set({
    id: event.params.tokenId.toString(),
    tokenId: event.params.tokenId,
    gigId: event.params.gigId,
    hustler: event.params.hustler.toLowerCase(),
    creator: event.params.creator.toLowerCase(),
    payoutAmount: event.params.payoutAmount,
    rating: Number(event.params.rating),
    deliverableCid: event.params.deliverableCid,
    timestamp: BigInt(event.block.timestamp),
  });
});

// Event Handlers for ProtocolBurnPool
ProtocolBurnPool.TokensBurned.handler(async ({ event, context }) => {
  const burnId = `${event.block.timestamp}-${event.transaction.hash}`;

  context.BurnEvent.set({
    id: burnId,
    amount: event.params.amount,
    totalBurnedToDate: event.params.totalBurnedToDate,
    timestamp: BigInt(event.block.timestamp),
    txHash: event.transaction.hash,
  });
});
