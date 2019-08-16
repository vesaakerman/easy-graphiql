/*
 * Copyright (C) 2018 DANS - Data Archiving and Networked Services (info@dans.knaw.nl)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as React from "react"
import { Component, createRef } from "react"
import GraphiQL from "graphiql"
import "graphiql/graphiql.css"
import "./App.css"

interface AppState {
    query?: string
    variables?: string
    operationName?: string
}

class App extends Component<{}, AppState> {
    constructor(props: any) {
        super(props)
        this.state = {
            query: undefined,
            variables: undefined,
            operationName: undefined,
        }
    }

    backendURL = createRef<HTMLSelectElement>()
    username = createRef<HTMLInputElement>()
    password = createRef<HTMLInputElement>()

    graphQLFetcher = async (graphQLParams) => {
        const username = this.username.current.value
        const password = this.password.current.value
        const encoded = window.btoa(`${username}:${password}`)
        const auth = "Basic " + encoded

        const response = await fetch(this.backendURL.current.value, {
            method: "post",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": auth,
            },
            body: JSON.stringify(graphQLParams),
            credentials: "include",
        })
        const responseBody = await response.text()

        try {
            return JSON.parse(responseBody)
        }
        catch (error) {
            return responseBody
        }
    }

    render() {
        return (
            <div id="graphiql">
                <div className="config">
                    <div>
                        <label htmlFor="username" className="title">Username</label>
                        <input ref={this.username} type="text" id="username" placeholder="Username"/>
                    </div>
                    <div>
                        <label htmlFor="password" className="title">Password</label>
                        <input ref={this.password} type="password" id="password" placeholder="Password"/>
                    </div>
                    <div>
                        <label htmlFor="backend_url" className="title">Server</label>
                        <select ref={this.backendURL}
                                id="backend_url">
                            <option selected={true}
                                    value="https://deasy.dans.knaw.nl/deposit-properties/graphql">
                                easy-deposit-properties
                            </option>
                        </select>
                    </div>
                </div>
                <GraphiQL fetcher={this.graphQLFetcher}
                          schema={undefined}
                          query={this.state.query}
                          variables={this.state.variables}
                          operationName={this.state.operationName}
                          onEditQuery={newQuery => this.setState(state => ({
                              ...state,
                              query: newQuery,
                          }))}
                          onEditVariables={newVariables => this.setState(state => ({
                              ...state,
                              variables: newVariables,
                          }))}
                          onEditOperationName={newOperationName => this.setState(state => ({
                              ...state,
                              operationName: newOperationName,
                          }))}/>
            </div>
        )
    }
}

export default App
