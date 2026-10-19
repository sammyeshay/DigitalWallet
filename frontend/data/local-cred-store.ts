import * as SecureStore from 'expo-secure-store';



export async function secStoreInfo(type: string, credID: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(`pk_${credID}`, value);

  // Add to the private key index item (tracking object)
  const index = await getSecIndex(type);
  if (!index.includes(credID)) {
    index.push(credID);
    await SecureStore.setItemAsync(`${type}list`, JSON.stringify(index));
  } else {
    // need to raise some sort of error here back to the route
  }
}

export async function secGetInfo(type: string, credID: string): Promise<string | null> {
    return await SecureStore.getItemAsync(`${type}_${credID}`);
}

// add function to list all private keys if required -- i think it may be a security concern so not adding yet

export async function getSecIndex(type: string): Promise<string[]> {
    // gets the store json list of private key id's - stored as JSON -> needs conversion from string
    const rawIndex = await SecureStore.getItemAsync(`${type}list`);
    if (!rawIndex) {
        return [];
    } else {
        return JSON.parse(rawIndex) as string[];
    }
}