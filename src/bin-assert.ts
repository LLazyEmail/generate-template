import { runAssertGenerated } from './assert-generated';

try {
  runAssertGenerated();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
