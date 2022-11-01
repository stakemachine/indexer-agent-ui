export enum ActionStatus {
    QUEUED = 'queued',
    APPROVED = 'approved',
    PENDING = 'pending',
    SUCCESS = 'success',
    FAILED = 'failed',
    CANCELED = 'canceled',
}

export enum ActionType {
    ALLOCATE = 'allocate',
    UNALLOCATE = 'unallocate',
    REALLOCATE = 'reallocate',
}

export interface ActionInput {
    type: ActionType
    deploymentID: string
    allocationID?: string
    amount?: string
    poi?: string
    force?: boolean
    source: string
    reason: string
    status: ActionStatus
    priority: number | undefined
}