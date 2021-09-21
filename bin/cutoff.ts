#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsBudgetEmergencyCutoffStack } from '../lib/cutoff-stack';

const app = new cdk.App();
new AwsBudgetEmergencyCutoffStack(app, 'AwsBudgetEmergencyCutoffStack', {
});
